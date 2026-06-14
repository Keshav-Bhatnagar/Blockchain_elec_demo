import mongoose from 'mongoose';

const managerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['CentralAdmin', 'ReturningOfficer', 'ElectoralOfficer', 'PresidingOfficer', 'Tester']
  },
  assignedZone: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  }
});

export default mongoose.model('Manager', managerSchema);
