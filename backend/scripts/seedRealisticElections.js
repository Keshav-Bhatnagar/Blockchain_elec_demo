import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import crypto from 'crypto';

dotenv.config({ override: true });

import Boundary from '../models/Boundary.js';
import ElectionPhase from '../models/ElectionPhase.js';
import { getBallotBoxContract } from '../utils/blockchainBridge.js';
import electoralRoll from '../config/electoralRoll.js';

const REAL_CONSTITUENCIES = [
  {
    id: 149, name: 'Varanasi', state: 'Uttar Pradesh', eligibleVoters: 1960000,
    candidates: [
      { name: 'Narendra Modi', partyId: 1, partyName: 'BJP', weight: 65, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Bharatiya_Janata_Party_logo.svg/1200px-Bharatiya_Janata_Party_logo.svg.png' },
      { name: 'Ajay Rai', partyId: 2, partyName: 'INC', weight: 25, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Indian_National_Congress_hand_logo.svg/1200px-Indian_National_Congress_hand_logo.svg.png' },
      { name: 'Ather Jamal Lari', partyId: 3, partyName: 'BSP', weight: 10, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Elephant_Bahujan_Samaj_Party.svg/1200px-Elephant_Bahujan_Samaj_Party.svg.png' }
    ]
  },
  {
    id: 458, name: 'Wayanad', state: 'Kerala', eligibleVoters: 1450000,
    candidates: [
      { name: 'Rahul Gandhi', partyId: 2, partyName: 'INC', weight: 60, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Indian_National_Congress_hand_logo.svg/1200px-Indian_National_Congress_hand_logo.svg.png' },
      { name: 'Annie Raja', partyId: 4, partyName: 'CPI', weight: 28, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/CPI-banner.svg/1200px-CPI-banner.svg.png' },
      { name: 'K. Surendran', partyId: 1, partyName: 'BJP', weight: 12, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Bharatiya_Janata_Party_logo.svg/1200px-Bharatiya_Janata_Party_logo.svg.png' }
    ]
  },
  {
    id: 317, name: 'Gandhinagar', state: 'Gujarat', eligibleVoters: 2100000,
    candidates: [
      { name: 'Amit Shah', partyId: 1, partyName: 'BJP', weight: 75, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Bharatiya_Janata_Party_logo.svg/1200px-Bharatiya_Janata_Party_logo.svg.png' },
      { name: 'Sonal Patel', partyId: 2, partyName: 'INC', weight: 25, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Indian_National_Congress_hand_logo.svg/1200px-Indian_National_Congress_hand_logo.svg.png' }
    ]
  },
  {
    id: 107, name: 'Lucknow', state: 'Uttar Pradesh', eligibleVoters: 2050000,
    candidates: [
      { name: 'Rajnath Singh', partyId: 1, partyName: 'BJP', weight: 60, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Bharatiya_Janata_Party_logo.svg/1200px-Bharatiya_Janata_Party_logo.svg.png' },
      { name: 'Ravidas Mehrotra', partyId: 5, partyName: 'SP', weight: 35, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Samajwadi_Party_Flag.jpg/800px-Samajwadi_Party_Flag.jpg' },
      { name: 'Sarwar Malik', partyId: 3, partyName: 'BSP', weight: 5, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Elephant_Bahujan_Samaj_Party.svg/1200px-Elephant_Bahujan_Samaj_Party.svg.png' }
    ]
  },
  {
    id: 56, name: 'New Delhi', state: 'Delhi', eligibleVoters: 1520000,
    candidates: [
      { name: 'Bansuri Swaraj', partyId: 1, partyName: 'BJP', weight: 55, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Bharatiya_Janata_Party_logo.svg/1200px-Bharatiya_Janata_Party_logo.svg.png' },
      { name: 'Somnath Bharti', partyId: 6, partyName: 'AAP', weight: 45, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Aam_Aadmi_Party_logo_%28English%29.svg/1200px-Aam_Aadmi_Party_logo_%28English%29.svg.png' }
    ]
  }
];

const SIMULATED_VOTES_PER_PC = 250; // Randomly cast 250 votes on-chain per PC for simulation

const seedRealisticSimulation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/indian-e-voting');
    console.log("📡 Connected to MongoDB.");

    const contract = await getBallotBoxContract();
    console.log("🔗 Connected to ECI Blockchain via Contract:", await contract.getAddress());

    // Clean old simulated MongoDB boundaries
    await Boundary.deleteMany({ geoId: { $gte: 500 } });
    console.log("🧹 Cleaned old simulated MongoDB boundaries (kept real India ones).");

    // Phase to Polling
    await ElectionPhase.updateOne(
      { _id: 'active_election' },
      { $set: { phase: 'Polling', electionName: 'General Elections 2024 (Simulated)', electionType: 'LokSabha', pollingDate: new Date() } },
      { upsert: true }
    );
    console.log("⏳ Set Election Phase to Polling.");

    // Setup Parties
    const uniqueParties = {};
    REAL_CONSTITUENCIES.forEach(pc => {
      pc.candidates.forEach(c => {
        uniqueParties[c.partyId] = { name: c.partyName, logo: c.logo };
      });
    });

    console.log("🏢 Registering Parties on-chain...");
    for (const [id, data] of Object.entries(uniqueParties)) {
      try {
        const tx = await contract.registerParty(data.name, data.logo);
        await tx.wait();
      } catch (e) { /* Ignore if already exists */ }
    }

    console.log("🗺️ Creating Constituencies and Candidates...");
    for (const pc of REAL_CONSTITUENCIES) {
      try {
        const tx1 = await contract.addConstituency(pc.id, pc.name);
        await tx1.wait();
      } catch (e) { /* Might exist */ }

      let candIdCounter = 1;
      for (const cand of pc.candidates) {
        try {
          const tx2 = await contract.addCandidate(pc.id, cand.name, cand.partyId, `ECI-SEED-${pc.id}-${candIdCounter}`);
          await tx2.wait();
          cand.onChainId = candIdCounter;
          candIdCounter++;
        } catch (e) { console.error(`Failed to add candidate ${cand.name}`, e.message); }
      }
      
      console.log(`✅ Seeded ${pc.name} (${pc.state}) - ${pc.eligibleVoters.toLocaleString()} eligible voters`);
    }

    console.log(`\n🗳️ Simulating ${SIMULATED_VOTES_PER_PC} Votes per Constituency...`);
    
    for (const pc of REAL_CONSTITUENCIES) {
      let votesCast = 0;
      for (let i = 0; i < SIMULATED_VOTES_PER_PC; i++) {
        // Weighted random choice for candidates
        const totalWeight = pc.candidates.reduce((sum, c) => sum + c.weight, 0);
        let randomVal = Math.random() * totalWeight;
        let selectedCandId = 1;
        
        for (const cand of pc.candidates) {
          if (randomVal <= cand.weight) {
            selectedCandId = cand.onChainId;
            break;
          }
          randomVal -= cand.weight;
        }

        const mockAadhaar = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        const voterHash = crypto.createHash('sha256').update(mockAadhaar + "SECRET").digest('hex');

        try {
          const tx = await contract.castBallot(pc.id, selectedCandId, voterHash);
          await tx.wait();
          votesCast++;
        } catch (e) {
          // Ignore reverted transactions (rare in simulation)
        }
      }
      console.log(`✓ Cast ${votesCast} simulated votes in ${pc.name}`);
    }

    // Now let's inject realistic populations into electoralRoll.js
    const fs = await import('fs');
    const path = await import('path');
    const rollPath = path.resolve(process.cwd(), 'config', 'electoralRoll.js');
    
    let rollContent = "export default {\n";
    for (const pc of REAL_CONSTITUENCIES) {
      rollContent += `  "${pc.id}": { name: "${pc.name}", totalEligibleVoters: ${pc.eligibleVoters} },\n`;
    }
    rollContent += "};\n";
    
    fs.writeFileSync(rollPath, rollContent);
    console.log("📜 Updated config/electoralRoll.js with realistic populations.");

    console.log("\n⏱️ Simulation finished! Waiting 5 seconds before publishing results...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Set Phase to Results
    await ElectionPhase.updateOne(
      { _id: 'active_election' },
      { $set: { phase: 'Results', countingDate: new Date() } }
    );
    console.log("🏆 Set Election Phase to Results.");

    // Publish Results for the simulated constituencies
    for (const pc of REAL_CONSTITUENCIES) {
      try {
        const isPub = await contract.isConstituencyResultsPublished(pc.id);
        if (!isPub) {
          const tx = await contract.publishConstituencyResults(pc.id);
          await tx.wait();
        }
      } catch (e) {
        console.error(`Failed to publish ${pc.name}`, e.message);
      }
    }
    console.log("🔏 Auto-published simulated constituencies on-chain!");

    console.log("\n🚀 SIMULATION & PUBLISH COMPLETE!");
    console.log("You can now go to the dashboard and map to see realistic candidates and random live vote counts!");

    process.exit(0);
  } catch (error) {
    console.error("FATAL ERROR:", error);
    process.exit(1);
  }
};

seedRealisticSimulation();
