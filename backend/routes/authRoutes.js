import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-eci-key-2026';

// ── Static User Seed Data (Simulation for RBAC) ──────────────────────────────
// In a real system, these would be in a DB and passwords securely hashed.
// For this demo, we pre-hash 'password123' so the login flow works identically to production.
const PWD_HASH = bcrypt.hashSync('password123', 10);

const USERS = [
  { username: 'central_admin', role: 'CentralAdmin', assignedZone: 0, employeeId: 'ECI-2026-HQ-001', passwordHash: PWD_HASH },
  { username: 'ro_amritsar_1', role: 'ReturningOfficer', assignedZone: 1, employeeId: 'ECI-2026-RO-101', passwordHash: PWD_HASH },
  { username: 'ero_amritsar_1', role: 'ElectoralOfficer', assignedZone: 1, employeeId: 'ECI-2026-ERO-101', passwordHash: PWD_HASH },
  { username: 'po_amritsar_1', role: 'PresidingOfficer', assignedZone: 1, employeeId: 'ECI-2026-PO-101', passwordHash: PWD_HASH },
  { username: 'role_tester', role: 'Tester', assignedZone: 0, employeeId: 'ECI-2026-TEST-999', passwordHash: PWD_HASH },
];

router.post('/login', async (req, res) => {
  try {
    const { username, password, employeeId } = req.body;
    
    if (!username || !password || !employeeId) {
      return res.status(400).json({ error: 'Username, password, and employeeId are required.' });
    }

    const user = USERS.find(u => u.username === username);
    if (!user || user.employeeId !== employeeId) {
      return res.status(401).json({ error: 'Invalid credentials or employee identity.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials or employee identity.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { username: user.username, role: user.role, assignedZone: user.assignedZone, employeeId: user.employeeId },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role,
        assignedZone: user.assignedZone,
        employeeId: user.employeeId
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
