import dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import crypto from 'crypto';
import ballotBoxArtifact from '../../blockchain/artifacts/contracts/BallotBox.sol/BallotBox.json' with { type: 'json' };

const PUNJAB_CONSTITUENCIES = [
  { id: 5, name: 'Gurdaspur', winner: 'BJP' },
  { id: 6, name: 'Amritsar', winner: 'INC' },
  { id: 7, name: 'Khadoor Sahib', winner: 'Independent' },
  { id: 8, name: 'Jalandhar', winner: 'INC' },
  { id: 9, name: 'Hoshiarpur', winner: 'AAP' },
  { id: 10, name: 'Anandpur Sahib', winner: 'AAP' },
  { id: 11, name: 'Ludhiana', winner: 'INC' },
  { id: 12, name: 'Fatehgarh Sahib', winner: 'AAP' },
  { id: 13, name: 'Faridkot', winner: 'Independent' },
  { id: 14, name: 'Firozepur', winner: 'AAP' },
  { id: 15, name: 'Bathinda', winner: 'INC' },
  { id: 16, name: 'Sangrur', winner: 'AAP' },
  { id: 17, name: 'Patiala', winner: 'INC' }
];

const PARTIES = {
  'AAP': { name: 'Aam Aadmi Party (AAP)', logo: '/uploads/aap.png' },
  'INC': { name: 'Indian National Congress (INC)', logo: '/uploads/inc.png' },
  'BJP': { name: 'Bharatiya Janata Party (BJP)', logo: '/uploads/bjp.png' },
  'Independent': { name: 'Independent', logo: '' }
};

const MOCK_NAMES = ["Gurpreet Singh", "Rajinder Kaur", "Amanpreet Dalal", "Balwinder Sandhu", "Navjot Gill", "Simranjit Mann", "Bhagwant Dass"];

async function main() {
  console.log("🚀 Starting Mock Punjab Data Seeder...");
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:8545');
  const signer = await provider.getSigner(0);
  const contract = new ethers.Contract(process.env.VOTING_CONTRACT_ADDRESS, ballotBoxArtifact.abi, signer);

  for (const pc of PUNJAB_CONSTITUENCIES) {
    console.log(`\n📍 Processing ${pc.name} (ID: ${pc.id})`);
    
    // 1. Register 4 candidates
    const partyKeys = ['AAP', 'INC', 'BJP', 'Independent'];
    let candidateIds = [];

    for (let i = 0; i < partyKeys.length; i++) {
      const pKey = partyKeys[i];
      const p = PARTIES[pKey];
      // Note: seedParties.js registers them in this order:
      // 1 BJP, 2 INC, 3 AAP, ... 11 Independent
      const pId = pKey === 'BJP' ? 1 : pKey === 'INC' ? 2 : pKey === 'AAP' ? 3 : 11;
      const cName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)] + " (" + pKey + ")";
      
      try {
        const tx = await contract.addCandidate(
          pc.id,
          cName,
          pId,
          "MockSeeder"
        );
        const receipt = await tx.wait();
        
        const cId = Number(await contract.constituencyCandidateCount(pc.id));
        candidateIds.push({ id: cId, party: pKey });
        process.stdout.write(`+`);
      } catch (e) {
        console.error(`\n Failed registering candidate for ${pKey}: ${e.message}`);
      }
    }
    console.log(` Registered candidates.`);

    // 2. Cast Votes to ensure the intended winner wins
    const winnerCIdObj = candidateIds.find(c => c.party === pc.winner);
    if (!winnerCIdObj) continue;

    const winnerCId = winnerCIdObj.id;
    const votesToCastForWinner = Math.floor(Math.random() * 5) + 10; // 10 to 14 votes
    
    let totalVotesCast = 0;
    
    for(let i = 0; i < votesToCastForWinner; i++) {
      const idHash = crypto.createHash('sha256').update(`${pc.id}_winner_${i}`).digest('hex');
      try {
        const tx = await contract.castBallot(pc.id, winnerCId, idHash);
        await tx.wait();
        totalVotesCast++;
      } catch(e) {}
    }

    for (const c of candidateIds) {
      if (c.id === winnerCId) continue;
      const votes = Math.floor(Math.random() * 5) + 2; // 2 to 6 votes
      for(let i = 0; i < votes; i++) {
        const idHash = crypto.createHash('sha256').update(`${pc.id}_${c.id}_loser_${i}`).digest('hex');
        try {
          const tx = await contract.castBallot(pc.id, c.id, idHash);
          await tx.wait();
          totalVotesCast++;
        } catch(e) {}
      }
    }
    console.log(` Casted ${totalVotesCast} votes. (${pc.winner} winning)`);

    // 3. Publish Results for this constituency
    try {
      const tx = await contract.publishConstituencyResults(pc.id);
      await tx.wait();
      console.log(` ✅ Published results for ${pc.name}`);
    } catch(e) {
      console.log(` ⚠️ Could not publish (maybe already published?): ${e.message}`);
    }
  }

  console.log("\n🎉 Punjab mock data completely seeded and published!");
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
