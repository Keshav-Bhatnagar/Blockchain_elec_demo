import express from 'express';
import crypto from 'crypto';
import { getBallotBoxContract } from '../utils/blockchainBridge.js';
import electoralRoll from '../config/electoralRoll.js';

const router = express.Router();

router.get('/form17c', async (req, res) => {
  try {
    const { constituencyId } = req.query;
    if (!constituencyId) return res.status(400).json({ error: "Missing constituencyId" });

    const contract = await getBallotBoxContract();

    // 1. Total Pre-seeded Eligible Population
    const populationData = electoralRoll[constituencyId] || { totalEligibleVoters: 0 };
    const eligiblePopulation = populationData.totalEligibleVoters;

    // 2. Total Transactions Authenticated on the Blockchain Ledger
    // In this context, we can just get total votes from the smart contract for the candidates
    const count = await contract.constituencyCandidateCount(constituencyId);
    let totalLedgerVotes = 0;
    for (let i = 1; i <= Number(count); i++) {
      const c = await contract.getCandidate(constituencyId, i);
      totalLedgerVotes += Number(c[4]);
    }

    // 3. Total Tendered Ballots Recorded
    let tenderedCount = 0;
    // We don't have a direct getter for the length of constituencyTenderedBallots array in Solidity
    // But we can estimate it or if we added a counter we'd use it. Since we didn't add a counter, we can just catch errors while indexing
    try {
      while (true) {
        await contract.constituencyTenderedBallots(constituencyId, tenderedCount);
        tenderedCount++;
      }
    } catch (e) {
      // Index out of bounds, so tenderedCount is the length
    }

    // 4. Current dynamic state block number
    const blockNumber = await contract.runner.provider.getBlockNumber();

    const payload = {
      constituencyId: Number(constituencyId),
      eligiblePopulation,
      totalLedgerVotes,
      tenderedCount,
      blockNumber,
      timestamp: new Date().toISOString()
    };

    // Sign metadata payload
    const systemKey = process.env.JWT_SECRET || 'super-secret-eci-key-2026';
    const signature = crypto.createHmac('sha256', systemKey).update(JSON.stringify(payload)).digest('hex');

    res.json({
      success: true,
      data: payload,
      cryptographicSignature: signature
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
