import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Boundary from '../models/Boundary.js';
import ElectionPhase, { PHASE_INFO } from '../models/ElectionPhase.js';
import { getLiveIndianWards } from '../controllers/geoController.js';
import { getBallotBoxContract } from '../utils/blockchainBridge.js';
import { findVoterById } from '../models/Voter.js';

const router = express.Router();

// ── Public: Current Election Phase (for VotingScreen) ─────────────────────────
router.get('/election-phase', async (req, res) => {
  try {
    let doc = await ElectionPhase.findById('active_election');
    if (!doc) doc = { phase: 'PreNotification', electionName: 'General Election 2026' };
    const info = PHASE_INFO[doc.phase] || {};
    res.json({ phase: doc.phase, electionName: doc.electionName, ...info });
  } catch (e) {
    res.json({ phase: 'Polling', allowVoting: true, label: 'Polling Day' }); // safe fallback
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const requireAdmin = (req, res) => {
  const provided = req.body.adminSecret;
  const expected = process.env.ADMIN_SECRET_PASSPHRASE || "ECI_SECRET_PASSPHRASE_2026";
  if (provided !== expected) {
    res.status(403).json({ error: "Access Denied: Invalid Administrative Credentials" });
    return false;
  }
  return true;
};

// ── 0. Voter Verification & Constituency / Ward Lookup ────────────────────────
// Primary path: resolve from the persistent voter registry (onboarded by ECI).
// Fallback:     deterministic hash-based assignment so demo flows still work
//               when a voter was not explicitly pre-registered.
router.post('/verify', async (req, res) => {
  const { voterId } = req.body;
  if (!voterId || String(voterId).length !== 12) {
    return res.status(400).json({ error: "Invalid National ID — must be exactly 12 characters." });
  }

  try {
    const contract = await getBallotBoxContract();
    let currentElectionType;
    try {
      currentElectionType = await contract.currentElectionType(); // 0 for National, 1 for Local
    } catch (e) {
      console.warn("⚠️ Warning: currentElectionType returned uninitialized or invalid data (0x). Defaulting to National Mode (0n).", e.shortMessage || e.message);
      currentElectionType = 0n;
    }

    // ── Registry lookup ────────────────────────────────────────────────────────
    const voterRecord = findVoterById(voterId);
    if (voterRecord) {
      // Map based on active scope
      let assignedId = currentElectionType === 0n ? voterRecord.constituencyId : voterRecord.wardId;
      return res.json({
        success: true,
        constituencyId: currentElectionType === 0n ? assignedId : null,
        wardId: currentElectionType === 1n ? assignedId : null,
        areaId: assignedId,
        source: 'registry',
        electionType: currentElectionType === 0n ? 'National' : 'Local'
      });
    }

    // ── Strict Constitutional Compliance: Deny Unregistered Voters ───────────────────
    return res.status(403).json({
      success: false,
      error: "EPIC ID Not Found: The provided National Voter ID is not registered in the Electoral Roll. You cannot cast a ballot."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── LIVE OSM OVERPASS API FETCH ───────────────────────────────────────────────
router.get('/boundaries/live', getLiveIndianWards);

// ── GET /api/voting/boundaries/all ────────────────────────────────────────────
// Supports ?subtype=LokSabha|VidhanSabha|Municipal|Panchayat and ?state=Punjab
router.get('/boundaries/all', async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.subtype) filter.electionSubtype = req.query.subtype;
    if (req.query.state)   filter.state = new RegExp(req.query.state, 'i');
    if (req.query.type)    filter.type = req.query.type;
    // Removed .limit(600) to ensure all wards (including Punjab) are loaded
    const allBoundaries = await Boundary.find(filter).sort({ geoId: 1 }).lean();
    res.json(allBoundaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/voting/boundaries ────────────────────────────────────────────────
router.get('/boundaries', async (req, res) => {
  try {
    const contract = await getBallotBoxContract();
    let currentElectionType;
    try {
      currentElectionType = await contract.currentElectionType();
    } catch (e) {
      console.warn("⚠️ Warning: currentElectionType returned uninitialized or invalid data (0x). Defaulting to National Mode (0n).", e.shortMessage || e.message);
      currentElectionType = 0n;
    }
    let boundaries = [];

    if (currentElectionType === 0n) { // National
      const dbBoundaries = await Boundary.find({ type: 'National', active: true }).sort({ geoId: 1 });
      boundaries = dbBoundaries.map(b => ({ id: b.geoId, name: b.name }));
    } else { // Local
      const dbBoundaries = await Boundary.find({ type: 'Local', active: true }).sort({ geoId: 1 });
      boundaries = dbBoundaries.map(b => ({ id: b.geoId, name: b.name }));
    }
    res.json({ electionType: currentElectionType === 0n ? 'National' : 'Local', boundaries });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ── 1. GET Candidates for a constituency ──────────────────────────────────────
router.get('/candidates', async (req, res) => {
  try {
    const { constituencyId } = req.query;
    if (!constituencyId) return res.status(400).json({ error: "Missing constituencyId parameter" });

    const contract = await getBallotBoxContract();
    const count = await contract.constituencyCandidateCount(constituencyId);
    const candidates = [];

    const PartyMeta = mongoose.models.PartyMeta || mongoose.model('PartyMeta', new mongoose.Schema({ partyName: String, colorHex: String }));
    const metaList = await PartyMeta.find({});

    for (let i = 1; i <= Number(count); i++) {
      const c = await contract.getCandidate(constituencyId, i);
      // Returns: (id, name, partyId, originalPartyId, voteCount, currentLogoUrl, originalPartyName)
      const switched = Number(c[2]) !== Number(c[3]);
      const partyNameStr = c[6];
      const m = metaList.find(x => x.partyName === partyNameStr);
      candidates.push({
        id: Number(c[0]),
        name: c[1],
        partyId: Number(c[2]),
        originalPartyId: Number(c[3]),
        voteCount: Number(c[4]),
        logoUrl: c[5],
        partySymbol: partyNameStr,  // original party name (for backward compat)
        colorHex: m ? m.colorHex : null,
        switched,
        isWithdrawn: c[8],
      });
    }
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── 1.5 POST Withdraw Candidate ───────────────────────────────────────────────
router.post('/candidates/withdraw', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { constituencyId, candidateId } = req.body;
    if (!constituencyId || !candidateId) return res.status(400).json({ error: "Missing required parameters" });
    
    let phaseDoc = await ElectionPhase.findById('active_election');
    if (phaseDoc && phaseDoc.phase !== 'Withdrawal') {
      return res.status(400).json({ error: `Withdrawals are only allowed during the Withdrawal phase. Current phase: ${phaseDoc.phase}` });
    }

    const contract = await getBallotBoxContract();
    const tx = await contract.withdrawCandidate(constituencyId, candidateId);
    await tx.wait();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── 2. POST Register Candidate (partyId-based) ────────────────────────────────
router.post('/candidates', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { name, partyId, constituencyId, nationalId } = req.body;
    if (!constituencyId) return res.status(400).json({ error: "Missing constituencyId" });
    if (!partyId)        return res.status(400).json({ error: "Missing partyId" });

    // Enforce Phase Gate
    let phaseDoc = await ElectionPhase.findById('active_election');
    if (!phaseDoc) phaseDoc = { phase: 'PreNotification' };
    const phaseInfo = PHASE_INFO[phaseDoc.phase] || {};
    if (!phaseInfo.allowNomination) {
      return res.status(403).json({ error: `Nominations are closed. Current phase: ${phaseInfo.label}. Candidates can only file during the Nomination Period.` });
    }

    // ── Automated Criminal Ledger Cross-Check ──
    if (nationalId) {
      const disqualifiedPath = path.join(__dirname, '../config/disqualifiedList.json');
      if (fs.existsSync(disqualifiedPath)) {
        const disqualifiedList = JSON.parse(fs.readFileSync(disqualifiedPath, 'utf-8'));
        const isBanned = disqualifiedList.some(person => person.nationalId === nationalId || person.name === name);
        if (isBanned) {
          return res.status(400).json({ 
            error: "Legal Compliance Error: Candidate stands disqualified under Section 8 of the Representation of the People Act 1951." 
          });
        }
      }
    }

    let loggedEmployeeId = "SYSTEM-FALLBACK";
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.decode(authHeader.split(' ')[1]);
        if (decoded && decoded.employeeId) {
          loggedEmployeeId = decoded.employeeId;
        }
      } catch (e) {}
    }

    const contract = await getBallotBoxContract();
    const tx = await contract.addCandidate(constituencyId, name, partyId, loggedEmployeeId);
    await tx.wait();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── 3. GET All Registered Parties ─────────────────────────────────────────────
router.get('/parties', async (req, res) => {
  try {
    const contract = await getBallotBoxContract();
    const count = await contract.partyCount();
    const parties = [];
    const PartyMeta = mongoose.models.PartyMeta || mongoose.model('PartyMeta', new mongoose.Schema({ partyName: String, colorHex: String }));
    const metaList = await PartyMeta.find({});

    for (let i = 1; i <= Number(count); i++) {
      const p = await contract.getParty(i);
      const m = metaList.find(x => x.partyName === p[1]);
      parties.push({ id: Number(p[0]), name: p[1], logoUrl: p[2], colorHex: m ? m.colorHex : null });
    }
    res.json(parties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── 4. POST Register New Party ────────────────────────────────────────────────
router.post('/register-party', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { name, logoUrl, colorHex } = req.body;
    if (!name) return res.status(400).json({ error: "Party name is required" });

    const contract = await getBallotBoxContract();
    const tx = await contract.registerParty(name, logoUrl || '');
    await tx.wait();

    if (colorHex) {
      const PartyMeta = mongoose.models.PartyMeta || mongoose.model('PartyMeta', new mongoose.Schema({ partyName: String, colorHex: String }));
      await PartyMeta.findOneAndUpdate({ partyName: name }, { colorHex }, { upsert: true, new: true });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── 5. POST Switch Party Post-Election ────────────────────────────────────────
router.post('/switch-party', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { constituencyId, candidateId, newPartyId } = req.body;
    if (!constituencyId || !candidateId || !newPartyId) {
      return res.status(400).json({ error: "constituencyId, candidateId, and newPartyId are required" });
    }

    const contract = await getBallotBoxContract();
    const tx = await contract.updateCandidateParty(constituencyId, candidateId, newPartyId);
    await tx.wait();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ── 6. POST Vote ──────────────────────────────────────────────────────────────
router.post('/vote', async (req, res) => {
  let identityHash;
  try {
    const { candidateId, voterId, constituencyId } = req.body;
    if (!candidateId || !voterId || !constituencyId) {
      return res.status(400).json({ error: "Missing required voter variables." });
    }

    // Enforce Phase Gate
    let phaseDoc = await ElectionPhase.findById('active_election');
    if (!phaseDoc) phaseDoc = { phase: 'PreNotification' };
    const phaseInfo = PHASE_INFO[phaseDoc.phase] || {};
    if (!phaseInfo.allowVoting) {
      return res.status(403).json({ error: `Voting is currently closed. Current phase: ${phaseInfo.label}.` });
    }

    identityHash = crypto.createHash('sha256').update(voterId).digest('hex');

    const contract = await getBallotBoxContract();
    const tx = await contract.castBallot(constituencyId, candidateId, identityHash);
    const receipt = await tx.wait();

    res.json({
      success: true,
      txHash: receipt.hash || tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });
  } catch (error) {
    const revertReason = error.reason || error.data?.message || error.message || 'Transaction failed.';
    if (revertReason.toLowerCase().includes('already voted') || revertReason.toLowerCase().includes('national id')) {
      console.log(`\n🚨 [SECURITY ALARM] DUPLICATE BALLOT ATTEMPT: ${identityHash} AT ${new Date().toISOString()} 🚨\n`);
      return res.status(403).json({ error: "Security Alert: Duplicate detected.", isDuplicate: true });
    }
    res.status(500).json({ error: revertReason });
  }
});

// ── 7. POST Challenge Vote ────────────────────────────────────────────────────
router.post('/challenge-vote', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { candidateId, voterId, constituencyId } = req.body;
    if (!constituencyId) return res.status(400).json({ error: "Missing constituencyId" });

    const identityHash = crypto.createHash('sha256').update(voterId).digest('hex');
    const contract = await getBallotBoxContract();
    const tx = await contract.castChallengeBallot(constituencyId, candidateId, identityHash);
    const receipt = await tx.wait();

    res.json({ success: true, isChallenge: true, txHash: receipt.hash || tx.hash, blockNumber: receipt.blockNumber });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ── 7.5. POST Tendered Vote (Rule 49P) ──────────────────────────────────────
router.post('/tendered-vote', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { candidateId, voterId, constituencyId } = req.body;
    if (!constituencyId || !voterId || !candidateId) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const identityHash = crypto.createHash('sha256').update(voterId).digest('hex');
    const nullifier = crypto.randomBytes(32).toString('hex'); // Generate cryptographically secure anonymous token
    const contract = await getBallotBoxContract();
    const tx = await contract.castTenderedBallot(constituencyId, candidateId, identityHash, `0x${nullifier}`);
    const receipt = await tx.wait();

    res.json({ success: true, isTendered: true, txHash: receipt.hash || tx.hash, blockNumber: receipt.blockNumber, nullifier });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ── 8. GET Per-Constituency Result Publication Status ─────────────────────────
// Replaces the old global /election-status endpoint.
router.get('/constituency-status', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing constituency id" });
    const contract = await getBallotBoxContract();
    const published = await contract.isConstituencyResultsPublished(id);
    res.json({ constituencyId: Number(id), published });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── 9. GET State Map Results ──────────────────────────────────────────────────
router.get('/state-results', async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) return res.status(400).json({ error: "State parameter required" });
    
    const boundaries = await Boundary.find({ state, type: 'National', active: true }).sort({ geoId: 1 }).lean();
    if (!boundaries.length) return res.json([]);

    const contract = await getBallotBoxContract();
    const PartyMeta = mongoose.models.PartyMeta || mongoose.model('PartyMeta', new mongoose.Schema({ partyName: String, colorHex: String }));
    const metaList = await PartyMeta.find({});
    
    const results = [];
    
    for (let b of boundaries) {
      const cid = b.geoId;
      let count = 0;
      try {
        count = await contract.constituencyCandidateCount(cid);
      } catch(e) { /* skip */ }
      
      let winner = null;
      let totalVotes = 0;
      
      for (let i = 1; i <= Number(count); i++) {
        const c = await contract.getCandidate(cid, i);
        const voteCount = Number(c[4]);
        totalVotes += voteCount;
        
        if (!winner || voteCount > winner.voteCount) {
          const partyNameStr = c[6];
          const m = metaList.find(x => x.partyName === partyNameStr);
          winner = {
            id: Number(c[0]),
            name: c[1],
            voteCount,
            partySymbol: partyNameStr,
            colorHex: m ? m.colorHex : null
          };
        }
      }
      
      // Check if results are actually published
      let published = false;
      try { published = await contract.isConstituencyResultsPublished(cid); } catch(e) {}

      results.push({
        constituencyId: cid,
        name: b.name,
        totalVotes,
        isPublished: published,
        winner: published && winner && winner.voteCount > 0 ? winner : null
      });
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


import ArchivedElection from '../models/ArchivedElection.js';

// ── GET /api/voting/archived-elections — Public list of all past elections ─────
router.get('/archived-elections', async (req, res) => {
  try {
    const archives = await ArchivedElection.find({}, {
      electionName: 1, electionType: 1, contractAddress: 1,
      archivedAt: 1, totalValidVotes: 1, 'results': { $slice: 0 }
    }).sort({ archivedAt: -1 });

    // Count seats per archive
    const list = await Promise.all(archives.map(async (a) => {
      const full = await ArchivedElection.findById(a._id);
      return {
        _id: a._id,
        electionName: a.electionName,
        electionType: a.electionType,
        contractAddress: a.contractAddress,
        archivedAt: a.archivedAt,
        totalValidVotes: a.totalValidVotes,
        totalSeats: full.results.length,
      };
    }));

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/voting/archived-elections/:id — Full result list ─────────────────
router.get('/archived-elections/:id', async (req, res) => {
  try {
    const archive = await ArchivedElection.findById(req.params.id);
    if (!archive) return res.status(404).json({ error: 'Archive not found.' });
    res.json(archive);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
