import express from 'express';
import { getBallotBoxContract } from '../utils/blockchainBridge.js';
import { upsertVoter, getAllVoters } from '../models/Voter.js';

const router = express.Router();

const requireAdmin = (req, res) => {
  const provided = req.body.adminSecret || req.query.adminSecret;
  const expected = process.env.ADMIN_SECRET_PASSPHRASE || "ECI_SECRET_PASSPHRASE_2026";
  if (provided !== expected) {
    res.status(403).json({ error: "Access Denied: Invalid Administrative Credentials" });
    return false;
  }
  return true;
};

// ── POST /api/admin/onboard-voter ─────────────────────────────────────────────
// Register a voter with an explicit constituencyId + wardId.
// The raw voterId is hashed before storage — never persisted in plain text.
router.post('/onboard-voter', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { voterId, constituencyId, wardId } = req.body;

    if (!voterId || String(voterId).length !== 12) {
      return res.status(400).json({ error: "voterId must be a 12-character National ID." });
    }
    if (!constituencyId || isNaN(Number(constituencyId))) {
      return res.status(400).json({ error: "constituencyId is required and must be numeric." });
    }
    if (!wardId || isNaN(Number(wardId))) {
      return res.status(400).json({ error: "wardId is required and must be numeric." });
    }

    const record = upsertVoter(voterId, Number(constituencyId), Number(wardId));
    res.json({
      success: true,
      message: `Voter onboarded and mapped to Constituency ${constituencyId}, Ward ${wardId}.`,
      identityHash: record.identityHash,
      constituencyId: record.constituencyId,
      wardId: record.wardId,
      registeredAt: record.registeredAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/admin/bulk-onboard ──────────────────────────────────────────────
// Simulate mass Electoral Roll Sync. Generates X random 12-digit EPIC cards.
router.post('/bulk-onboard', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { constituencyId, wardId, count } = req.body;
    
    if (!constituencyId || !wardId || !count) {
      return res.status(400).json({ error: "constituencyId, wardId, and count are required." });
    }
    
    let added = 0;
    for(let i=0; i<Number(count); i++) {
      // Generate a random 12-digit EPIC/Aadhaar-like string
      const randomEpic = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      upsertVoter(randomEpic, Number(constituencyId), Number(wardId));
      added++;
    }

    res.json({
      success: true,
      message: `Successfully synchronized ${added} voter records to Constituency ${constituencyId}, Ward ${wardId}.`,
      addedCount: added
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/admin/voters ─────────────────────────────────────────────────────
// Returns the full voter registry (admin-only). Raw voter IDs are never exposed —
// only hashes, constituency assignments, and ward tags are returned.
router.get('/voters', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const voters = getAllVoters();
    res.json({ count: voters.length, voters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/admin/election-type ─────────────────────────────────────────────
router.post('/election-type', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { electionType } = req.body;
    if (electionType === undefined) {
      return res.status(400).json({ error: "electionType is required (0 for National, 1 for Local)." });
    }
    const contract = await getBallotBoxContract();
    const tx = await contract.setElectionType(electionType);
    await tx.wait();
    res.json({ success: true, electionType });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ── POST /api/admin/constituency ──────────────────────────────────────────────
router.post('/constituency', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: "id and name are required." });
    
    const contract = await getBallotBoxContract();
    const tx = await contract.addConstituency(id, name);
    await tx.wait();
    res.json({ success: true, id, name });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ── POST /api/admin/ward ──────────────────────────────────────────────────────
router.post('/ward', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: "id and name are required." });
    
    const contract = await getBallotBoxContract();
    const tx = await contract.addWard(id, name);
    await tx.wait();
    res.json({ success: true, id, name });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ── POST /api/admin/publish-results ──────────────────────────────────────────
// Seals voting for a single constituency and authorises public result display.
router.post('/publish-results', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { constituencyId } = req.body;
    if (!constituencyId) {
      return res.status(400).json({ error: "constituencyId is required." });
    }
    const contract = await getBallotBoxContract();
    const tx = await contract.publishConstituencyResults(constituencyId);
    await tx.wait();
    res.json({ success: true, constituencyId: Number(constituencyId) });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ── POST /api/admin/publish-results-bulk ─────────────────────────────────────
router.post('/publish-results-bulk', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { constituencyIds } = req.body;
    if (!constituencyIds || !Array.isArray(constituencyIds)) {
      return res.status(400).json({ error: "constituencyIds array is required." });
    }
    const contract = await getBallotBoxContract();
    let publishedCount = 0;
    let skippedCount = 0;
    
    for (const cid of constituencyIds) {
      try {
        const isPub = await contract.isConstituencyResultsPublished(cid);
        if (!isPub) {
          const tx = await contract.publishConstituencyResults(cid);
          await tx.wait();
          publishedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`Failed to publish ${cid}:`, err.message);
      }
    }
    res.json({ success: true, publishedCount, skippedCount });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ── Election Phase Management ─────────────────────────────────────────────────
import ElectionPhase, { PHASES, PHASE_INFO } from '../models/ElectionPhase.js';

// GET /api/admin/election-phase — Returns current phase + metadata
router.get('/election-phase', async (req, res) => {
  try {
    let doc = await ElectionPhase.findById('active_election');
    if (!doc) {
      doc = await ElectionPhase.create({ _id: 'active_election', phase: 'PreNotification' });
    }
    const info = PHASE_INFO[doc.phase];
    res.json({
      phase: doc.phase,
      phaseIndex: PHASES.indexOf(doc.phase),
      totalPhases: PHASES.length,
      ...info,
      electionName: doc.electionName,
      electionType: doc.electionType,
      notifiedAt: doc.notifiedAt,
      pollingDate: doc.pollingDate,
      updatedAt: doc.updatedAt,
      allPhases: PHASES.map((p, i) => ({ key: p, index: i, ...PHASE_INFO[p] })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/election-phase/advance — Move to next phase
router.post('/election-phase/advance', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    let doc = await ElectionPhase.findById('active_election');
    if (!doc) {
      doc = await ElectionPhase.create({ _id: 'active_election', phase: 'PreNotification' });
    }
    const currentIdx = PHASES.indexOf(doc.phase);
    if (currentIdx >= PHASES.length - 1) {
      return res.status(400).json({ error: 'Election is already in final phase (Results). Cannot advance further.' });
    }
    const nextPhase = PHASES[currentIdx + 1];
    doc.phase = nextPhase;
    doc.updatedAt = new Date();
    // Auto-set timestamps
    if (nextPhase === 'Notification') doc.notifiedAt = new Date();
    if (nextPhase === 'Nomination') doc.nominationStart = new Date();
    if (nextPhase === 'Polling') doc.pollingDate = new Date();
    if (nextPhase === 'Counting') doc.countingDate = new Date();
    await doc.save();
    await doc.save();
    res.json({
      success: true,
      phase: doc.phase,
      phaseIndex: PHASES.indexOf(doc.phase),
      totalPhases: PHASES.length,
      ...PHASE_INFO[doc.phase],
      allPhases: PHASES.map((p, i) => ({ key: p, index: i, ...PHASE_INFO[p] })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/election-phase/set — Jump to specific phase (for demo)
router.post('/election-phase/set', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { phase, electionName, electionType } = req.body;
    if (!PHASES.includes(phase)) {
      return res.status(400).json({ error: `Invalid phase. Valid: ${PHASES.join(', ')}` });
    }
    let doc = await ElectionPhase.findById('active_election');
    if (!doc) {
      doc = await ElectionPhase.create({ _id: 'active_election' });
    }
    doc.phase = phase;
    if (electionName) doc.electionName = electionName;
    if (electionType) doc.electionType = electionType;
    doc.updatedAt = new Date();
    await doc.save();
    res.json({
      success: true,
      phase: doc.phase,
      phaseIndex: PHASES.indexOf(doc.phase),
      totalPhases: PHASES.length,
      ...PHASE_INFO[doc.phase],
      allPhases: PHASES.map((p, i) => ({ key: p, index: i, ...PHASE_INFO[p] })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/election-phase/reset — Reset to PreNotification
router.post('/election-phase/reset', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    await ElectionPhase.findByIdAndUpdate('active_election', {
      phase: 'PreNotification', updatedAt: new Date(),
      notifiedAt: null, nominationStart: null, nominationEnd: null,
      scrutinyDate: null, withdrawalEnd: null, pollingDate: null, countingDate: null,
    }, { upsert: true });
    res.json({ success: true, phase: 'PreNotification' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import ArchivedElection from '../models/ArchivedElection.js';
import Boundary from '../models/Boundary.js';

// POST /api/admin/archive-election — Save current results permanently
router.post('/archive-election', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    let doc = await ElectionPhase.findById('active_election');
    if (!doc || doc.phase !== 'Results') {
      return res.status(400).json({ error: 'Election must be in Results phase to be archived.' });
    }

    const contract = await getBallotBoxContract();
    const boundaries = await Boundary.find({ type: doc.electionType === 'Local' ? 'Local' : 'National' });
    
    let archiveResults = [];
    let grandTotalVotes = 0;

    for (let b of boundaries) {
      try {
        const isPub = await contract.isConstituencyResultsPublished(b.geoId);
        if (!isPub) continue;

        const count = await contract.constituencyCandidateCount(b.geoId);
        let maxVotes = -1;
        let winners = [];
        let totalVotes = 0;
        let activeCands = 0;

        for (let i = 1; i <= Number(count); i++) {
          const c = await contract.getCandidate(b.geoId, i);
          if (!c[8]) { // not withdrawn
            activeCands++;
            const v = Number(c[4]);
            totalVotes += v;
            if (v > maxVotes) {
              maxVotes = v;
              winners = [c];
            } else if (v === maxVotes) {
              winners.push(c);
            }
          }
        }

        grandTotalVotes += totalVotes;

        if (winners.length > 0) {
          const w = winners[0];
          archiveResults.push({
            constituencyId: b.geoId,
            constituencyName: b.name,
            state: b.state,
            winnerName: winners.length > 1 ? "TIE RESOLUTION PENDING" : w[1],
            winnerParty: winners.length > 1 ? "Multiple" : w[6],
            winnerLogo: winners.length > 1 ? "" : w[5],
            totalVotes: totalVotes,
            isUncontested: activeCands === 1,
            isTie: winners.length > 1
          });
        }
      } catch(e) {
        console.error(`Skipping ${b.name} during archive`, e);
      }
    }

    const archive = await ArchivedElection.create({
      electionName: doc.electionName || 'General Election',
      electionType: doc.electionType || 'National',
      contractAddress: process.env.VOTING_CONTRACT_ADDRESS,
      totalValidVotes: grandTotalVotes,
      results: archiveResults
    });

    res.json({ success: true, archiveId: archive._id, count: archiveResults.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import { exec } from 'child_process';
import path from 'path';

router.post('/simulate-election', (req, res) => {
  if (!requireAdmin(req, res)) return;
  
  exec('node scripts/seedRealisticElections.js', { cwd: path.resolve(process.cwd()) }, (err, stdout, stderr) => {
    if (err) {
      console.error("Simulation script failed:", err);
      return res.status(500).json({ error: "Simulation failed: " + err.message });
    } else {
      console.log("Simulation script finished:", stdout);
      return res.json({ success: true, message: "Simulation and Auto-Publish completed successfully!" });
    }
  });
});

export default router;
