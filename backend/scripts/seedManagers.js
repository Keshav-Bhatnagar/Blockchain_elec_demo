import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Manager from '../models/Manager.js';

const seedData = [
  {
    employeeId: "ECI-2026-HQ-001",
    username: "eci_hq_admin",
    role: "CentralAdmin",
    assignedZone: 0,
    password: "ApexSecret2026"
  },
  {
    employeeId: "ECI-2026-RO-101",
    username: "ro_amritsar",
    role: "ReturningOfficer",
    assignedZone: 101,
    password: "AmritsarRO@2026"
  },
  {
    employeeId: "ECI-2026-PO-501",
    username: "po_booth_abc",
    role: "PresidingOfficer",
    assignedZone: 101,
    password: "BoothPass#501"
  },
  {
    employeeId: "ECI-2026-TEST-999",
    username: "role_tester",
    role: "Tester",
    assignedZone: 0,
    password: "password123"
  }
];

async function seedDatabase() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/evoting');
  
  console.log("🧹 Cleaning old department records...");
  await Manager.deleteMany({});

  for (let user of seedData) {
    // Password hashing layer for industry security standards
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(user.password, salt);
    
    await Manager.create({
      employeeId: user.employeeId,
      username: user.username,
      role: user.role,
      assignedZone: user.assignedZone,
      passwordHash: passwordHash
    });
    console.log(`✅ Created Officer Profile: ${user.employeeId} (${user.role})`);
  }

  console.log("🚀 Database Seeding Completed Successfully!");
  process.exit();
}

seedDatabase();
