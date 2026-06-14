import mongoose from 'mongoose';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import ElectionPhase from '../models/ElectionPhase.js';
import ballotBoxArtifact from '../../blockchain/artifacts/contracts/BallotBox.sol/BallotBox.json' with { type: 'json' };

dotenv.config();

async function runDiagnostics() {
  console.log("==================================================");
  console.log("🔍 E-VOTING SYSTEM DIAGNOSTIC REPORT");
  console.log("==================================================");

  // 1. Check MongoDB
  console.log("\n1. Testing MongoDB Connection...");
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/indian-e-voting';
    console.log(`   Attempting connection to: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("   ✅ MongoDB Connected successfully!");
    
    const Boundary = mongoose.model('Boundary', new mongoose.Schema({}, { strict: false }));
    
    const boundaryCount = await Boundary.countDocuments();
    const phaseDoc = await ElectionPhase.findById('active_election');
    
    console.log(`   📊 Total boundaries in DB: ${boundaryCount}`);
    if (phaseDoc) {
      console.log(`   ⏳ Current Election Phase in DB: ${phaseDoc.phase}`);
      console.log(`   📝 Election Type: ${phaseDoc.electionType}`);
    } else {
      console.log(`   ⚠️ No active election phase document found in MongoDB!`);
    }
  } catch (err) {
    console.error("   ❌ MongoDB Error:", err.message);
  }

  // 2. Check Blockchain Node
  console.log("\n2. Testing Blockchain Node (Hardhat)...");
  const providerUrl = process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:8545';
  console.log(`   Connecting to JSON-RPC Provider: ${providerUrl}`);
  const provider = new ethers.JsonRpcProvider(providerUrl);
  
  let networkOk = false;
  try {
    const network = await provider.getNetwork();
    console.log(`   ✅ Connected to Blockchain! Chain ID: ${network.chainId}`);
    const blockNumber = await provider.getBlockNumber();
    console.log(`   🧱 Current Block Number: ${blockNumber}`);
    networkOk = true;
  } catch (err) {
    console.error(`   ❌ Blockchain Provider Error: Could not connect to ${providerUrl}. Is Hardhat running?`);
    console.error(`      Detail: ${err.message}`);
  }

  // 3. Check Smart Contract
  if (networkOk) {
    console.log("\n3. Testing Smart Contract Deployment...");
    const contractAddress = process.env.VOTING_CONTRACT_ADDRESS;
    console.log(`   Contract Address in env: ${contractAddress}`);
    
    if (!contractAddress || contractAddress === '0x' || contractAddress.length !== 42) {
      console.log(`   ❌ Invalid contract address format in .env!`);
    } else {
      try {
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          console.log(`   ❌ No contract code found at ${contractAddress}! (Returned 0x).`);
        } else {
          console.log(`   ✅ Contract code is present at ${contractAddress} (size: ${code.length} chars).`);
          
          const contract = new ethers.Contract(contractAddress, ballotBoxArtifact.abi, provider);
          try {
            const partyCount = await contract.partyCount();
            console.log(`   🏢 Registered Parties on Blockchain: ${partyCount.toString()}`);
            const elType = await contract.currentElectionType();
            console.log(`   🗳️ Contract Election Type (0=National, 1=Local): ${elType}`);
          } catch (e) {
            console.error(`   ❌ Failed to call basic contract methods. The contract at this address might not match the expected interface or has reverted.`);
            console.error(`      Detail: ${e.message}`);
          }
        }
      } catch (err) {
        console.error(`   ❌ Error querying contract address: ${err.message}`);
      }
    }
  }

  // 4. Test Backend API responsiveness
  console.log("\n4. Testing Local Backend Server API...");
  try {
    const port = process.env.PORT || 5000;
    const res = await fetch(`http://localhost:${port}/api/voting/election-phase`);
    if (res.ok) {
      const data = await res.json();
      console.log(`   ✅ Backend Server is ALIVE on port ${port}!`);
      console.log(`      API Phase Response:`, JSON.stringify(data));
    } else {
      console.log(`   ❌ Backend responded with status ${res.status}`);
    }
  } catch (err) {
    console.error(`   ❌ Backend API Connection Failed: Is the Node server running on port 5000?`);
    console.error(`      Detail: ${err.message}`);
  }

  console.log("\n==================================================");
  await mongoose.disconnect();
  process.exit(0);
}

runDiagnostics();
