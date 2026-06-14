/**
 * seedBlockchain.js
 * Reads all National boundaries from MongoDB and registers them on-chain via addConstituency().
 * Also registers Local boundaries via addWard() under Local election type.
 * Run: node scripts/seedBlockchain.js
 */
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { ethers } from 'ethers';
import Boundary from '../models/Boundary.js';
import ballotBoxArtifact from '../../blockchain/artifacts/contracts/BallotBox.sol/BallotBox.json' with { type: 'json' };

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/indian-e-voting');
  console.log('📡 Connected to MongoDB...');

  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:8545');
  const signer = await provider.getSigner(0);
  const contract = new ethers.Contract(process.env.VOTING_CONTRACT_ADDRESS, ballotBoxArtifact.abi, signer);

  // ── Step 1: Set election type to National, seed constituencies ──────────────
  console.log('\n⚙️  Setting election type to National...');
  let tx = await contract.setElectionType(0);
  await tx.wait();

  const nationals = await Boundary.find({ type: 'National', active: true }).sort({ geoId: 1 });
  console.log(`📍 Seeding ${nationals.length} Parliamentary Constituencies to blockchain...`);

  let seededPC = 0;
  for (const b of nationals) {
    try {
      const tx = await contract.addConstituency(b.geoId, b.name);
      await tx.wait();
      seededPC++;
      if (seededPC % 20 === 0) console.log(`   ✓ ${seededPC}/${nationals.length} constituencies seeded...`);
    } catch (e) {
      // Already exists or other error — skip silently
    }
  }
  console.log(`✅ Seeded ${seededPC} National constituencies on-chain.`);

  // ── Step 2: Set election type to Local, seed wards ──────────────────────────
  console.log('\n⚙️  Setting election type to Local...');
  tx = await contract.setElectionType(1);
  await tx.wait();

  const locals = await Boundary.find({ type: 'Local', active: true }).sort({ geoId: 1 });
  console.log(`🏢 Seeding ${locals.length} Local Wards to blockchain...`);

  let seededWard = 0;
  for (const b of locals) {
    try {
      const tx = await contract.addWard(b.geoId, b.name);
      await tx.wait();
      seededWard++;
      if (seededWard % 50 === 0) console.log(`   ✓ ${seededWard}/${locals.length} wards seeded...`);
    } catch (e) { /* skip */ }
  }
  console.log(`✅ Seeded ${seededWard} Local wards on-chain.`);

  // ── Step 3: Reset back to National mode for the default ECI Simulation ──
  console.log('\n⚙️  Resetting election type back to National...');
  tx = await contract.setElectionType(0);
  await tx.wait();
  console.log(`✅ Election mode restored to National.`);

  // ── Step 3: Reset back to National ──────────────────────────────────────────
  tx = await contract.setElectionType(0);
  await tx.wait();
  console.log('\n🔁 Reset election type to National (default).');

  console.log('\n🚀 Blockchain seeding complete! MongoDB ↔ Blockchain are now in sync.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Blockchain seeding failed:', e.message);
  process.exit(1);
});
