import dotenv from 'dotenv';
dotenv.config({ override: true });
console.log("DEBUG ENV VOTING_CONTRACT_ADDRESS:", process.env.VOTING_CONTRACT_ADDRESS);
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import mongoose from 'mongoose';
import votingRouter from './routes/votingRoutes.js';
import adminRouter  from './routes/adminRoutes.js';
import authRouter   from './routes/authRoutes.js';
import { getBallotBoxContract } from './utils/blockchainBridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Connect to MongoDB ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/indian-e-voting')
  .then(() => console.log('✓ MongoDB connected.'))
  .catch(err => console.error('✗ MongoDB connection error:', err.message));

const app = express();
app.use(cors());
app.use(express.json());


// ── Serve uploaded logos statically ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Multer – save party logos as-is ──────────────────────────────────────────
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname) || '.png';
    const name = `party_logo_${Date.now()}${ext}`;
    cb(null, name);
  },
});
const uploadLogo = multer({
  storage: logoStorage,
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

// ── Upload endpoint ───────────────────────────────────────────────────────────
app.post('/api/voting/upload-logo', uploadLogo.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received.' });
  const host    = `${req.protocol}://${req.get('host')}`;
  const logoUrl = `${host}/uploads/${req.file.filename}`;
  res.json({ success: true, logoUrl });
});

// Clear base-route test to confirm server health
app.get('/', (req, res) => {
  res.send("Voting Backend is Healthy!");
});

// Mount the blockchain voting router explicitly
app.use('/api/voting', votingRouter);

// Mount the admin router (publish-results, etc.)
app.use('/api/admin', adminRouter);

import complianceRouter from './routes/complianceRoutes.js';

// Mount the auth router
app.use('/api/auth', authRouter);

// Mount the compliance router
app.use('/api/compliance', complianceRouter);

import electoralRoll from './config/electoralRoll.js';

app.get('/api/constituency/stats', (req, res) => {
  const { id } = req.query;
  const stats = electoralRoll[id] || { name: "Unknown Constituency", totalEligibleVoters: 1000000 };
  res.json(stats);
});

async function checkBlockchainConnection() {
  try {
    const contract = await getBallotBoxContract();
    console.log(`✓ Blockchain connection established.`);
    console.log(`✓ BallotBox contract live at: ${process.env.VOTING_CONTRACT_ADDRESS}`);
    console.log(`  → Admin can register candidates via POST /api/voting/candidates`);
  } catch (err) {
    console.error("✗ Failed to connect to the blockchain node:", err.shortMessage || err.message);
  }
}

checkBlockchainConnection();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
