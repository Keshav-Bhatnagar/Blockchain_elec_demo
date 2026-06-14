/**
 * seedParties.js
 * Auto-registers major Indian political parties on the blockchain.
 * Run: node scripts/seedParties.js
 * 
 * This script should be run AFTER contract deployment to ensure the
 * party registry is always populated for demo/testing.
 */
import dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import ballotBoxArtifact from '../../blockchain/artifacts/contracts/BallotBox.sol/BallotBox.json' with { type: 'json' };

// Major national & state parties recognized by ECI
const PARTIES = [
  { name: 'Bharatiya Janata Party (BJP)', logoUrl: '/uploads/bjp.png' },
  { name: 'Indian National Congress (INC)', logoUrl: '/uploads/inc.png' },
  { name: 'Aam Aadmi Party (AAP)', logoUrl: '/uploads/aap.png' },
  { name: 'Bahujan Samaj Party (BSP)', logoUrl: '/uploads/bsp.png' },
  { name: 'Communist Party of India (Marxist) (CPI-M)', logoUrl: '/uploads/cpim.png' },
  { name: 'Nationalist Congress Party (NCP)', logoUrl: '/uploads/ncp.png' },
  { name: 'All India Trinamool Congress (TMC)', logoUrl: '/uploads/tmc.png' },
  { name: 'Dravida Munnetra Kazhagam (DMK)', logoUrl: '/uploads/dmk.png' },
  { name: 'Telugu Desam Party (TDP)', logoUrl: '/uploads/tdp.png' },
  { name: 'Shiv Sena', logoUrl: '/uploads/shivsena.png' },
  { name: 'Independent', logoUrl: '' },
];

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:8545');
  const signer = await provider.getSigner(0);
  const contract = new ethers.Contract(process.env.VOTING_CONTRACT_ADDRESS, ballotBoxArtifact.abi, signer);

  // Check existing party count
  const existingCount = Number(await contract.partyCount());
  if (existingCount >= PARTIES.length) {
    console.log(`✅ ${existingCount} parties already registered. Skipping.`);
    process.exit(0);
  }

  console.log(`\n🏛️  Registering ${PARTIES.length - existingCount} political parties on-chain...\n`);

  let registered = 0;
  for (let i = existingCount; i < PARTIES.length; i++) {
    const p = PARTIES[i];
    try {
      const tx = await contract.registerParty(p.name, p.logoUrl);
      await tx.wait();
      registered++;
      console.log(`   ✓ #${existingCount + registered}: ${p.name}`);
    } catch (e) {
      console.error(`   ✗ Failed to register "${p.name}": ${e.reason || e.message}`);
    }
  }

  console.log(`\n🚀 Done! ${registered} parties registered. Total on-chain: ${existingCount + registered}\n`);
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Party seeding failed:', e.message);
  process.exit(1);
});
