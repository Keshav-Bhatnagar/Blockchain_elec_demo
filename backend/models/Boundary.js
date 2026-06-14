import mongoose from 'mongoose';

const boundarySchema = new mongoose.Schema({
  geoId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['National', 'Local'] },
  // More granular election subtype for UI filtering
  electionSubtype: {
    type: String,
    enum: ['LokSabha', 'VidhanSabha', 'Municipal', 'Panchayat', 'RajyaSabha'],
    default: null
  },
  state: { type: String },          // e.g. 'Punjab', 'Delhi'
  meta: { type: mongoose.Schema.Types.Mixed },
  parentConstituencyId: { type: Number },
  active: { type: Boolean, default: true }
});

export default mongoose.models.Boundary || mongoose.model('Boundary', boundarySchema);
