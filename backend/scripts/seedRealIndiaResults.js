import dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Boundary from '../models/Boundary.js';
import ballotBoxArtifact from '../../blockchain/artifacts/contracts/BallotBox.sol/BallotBox.json' with { type: 'json' };

const PARTY_CSV_URL = 'https://raw.githubusercontent.com/piyushpbarve/India-Election-Result-2024-Analysis/main/partywise_results.csv';
const RESULTS_CSV_URL = 'https://raw.githubusercontent.com/piyushpbarve/India-Election-Result-2024-Analysis/main/constituencywise_results.csv';

function normalizeName(name) {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fetchCsv(url) {
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    let row = {};
    headers.forEach((h, idx) => row[h] = cols[idx]);
    data.push(row);
  }
  return data;
}

// Common mismatches mapping
const PC_ALIASES = {
  "anandpur sahib": "anandpursahib",
  "fatehgarh sahib": "fatehgarhsahib",
  "khadoor sahib": "khadoorsahib",
  "mumbai north": "mumbainorth",
  // Many others might exist, normalization mostly handles spaces.
};

async function main() {
  console.log("🚀 Starting Pan-India 2024 Real Election Data Seeder...");

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/indian-e-voting');
  console.log("📡 Connected to MongoDB.");

  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:8545');
  const signer = await provider.getSigner(0);
  const contract = new ethers.Contract(process.env.VOTING_CONTRACT_ADDRESS, ballotBoxArtifact.abi, signer);

  console.log("⚙️ Fetching 2024 CSV Datasets...");
  const partyRows = await fetchCsv(PARTY_CSV_URL);
  const resultRows = await fetchCsv(RESULTS_CSV_URL);

  // Map parties by Party_ID
  const partyMap = {}; // Party_ID -> Party Name
  partyRows.forEach(p => {
    partyMap[p.Party_ID] = p.Party.split('-')[0].trim();
  });

  // Blockchain party registration cache
  let onChainPartyIdMap = {}; // Party Name -> on-chain ID
  let currentOnChainPartyCount = Number(await contract.partyCount());
  
  // Cache existing parties
  for(let i=1; i<=currentOnChainPartyCount; i++) {
    const pInfo = await contract.getParty(i);
    onChainPartyIdMap[pInfo[1]] = i;
  }

  // Get all National Boundaries
  const boundaries = await Boundary.find({ type: 'National' });
  console.log(`📍 Found ${boundaries.length} constituencies in DB.`);

  let matchCount = 0;

  for (const b of boundaries) {
    const bNameNorm = normalizeName(b.name);
    // Find matching result
    let match = resultRows.find(r => normalizeName(r.Constituency_Name) === bNameNorm);
    
    // Fuzzy matching fallback
    if (!match) {
       match = resultRows.find(r => normalizeName(r.Constituency_Name).includes(bNameNorm) || bNameNorm.includes(normalizeName(r.Constituency_Name)));
    }

    if (!match) {
      console.log(`⚠️ No 2024 data match found for: ${b.name}`);
      continue;
    }

    matchCount++;
    const winningPartyName = partyMap[match.Party_ID] || "Independent";
    const winnerName = match.Winning_Candidate;

    // Check if results are already published for this constituency
    const isPub = await contract.isConstituencyResultsPublished(b.geoId);
    if (isPub) {
      // Skip if already published (e.g. Punjab mock data)
      continue;
    }

    // Register party on chain if not exists
    let chainPartyId = onChainPartyIdMap[winningPartyName];
    if (!chainPartyId) {
      // Find logo or fallback
      let logo = '';
      if (winningPartyName.includes('Aam Aadmi')) logo = '/uploads/aap.png';
      else if (winningPartyName.includes('Congress')) logo = '/uploads/inc.png';
      else if (winningPartyName.includes('Bharatiya Janata')) logo = '/uploads/bjp.png';
      
      const tx = await contract.registerParty(winningPartyName, logo);
      await tx.wait();
      currentOnChainPartyCount++;
      chainPartyId = currentOnChainPartyCount;
      onChainPartyIdMap[winningPartyName] = chainPartyId;
    }

    process.stdout.write(`\r📍 Seeding [${matchCount}/543] - ${b.name} (${winningPartyName})      `);

    // 1. Add Winning Candidate
    try {
      const txC = await contract.addCandidate(b.geoId, winnerName, chainPartyId, "API_SEEDER");
      await txC.wait();
      const wCId = Number(await contract.constituencyCandidateCount(b.geoId));

      // 2. Add Runner up (Mock)
      const txR = await contract.addCandidate(b.geoId, "Runner Up", onChainPartyIdMap["Independent"] || 1, "API_SEEDER");
      await txR.wait();
      const rCId = Number(await contract.constituencyCandidateCount(b.geoId));

      // 3. Cast Votes
      const h = crypto.createHash('sha256').update(`${b.geoId}_w_0`).digest('hex');
      const vTx = await contract.castBallot(b.geoId, wCId, h);
      await vTx.wait();

      // 4. Publish
      const txP = await contract.publishConstituencyResults(b.geoId);
      await txP.wait();
    } catch(e) {
      console.log(`\n❌ Failed at ${b.name}: ${e.message}`);
    }
  }

  console.log(`\n🎉 Successfully seeded and synced ${matchCount} actual 2024 constituencies!`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
