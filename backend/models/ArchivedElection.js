import mongoose from 'mongoose';

const archivedElectionSchema = new mongoose.Schema({
  electionName: { type: String, required: true },
  electionType: { type: String, required: true }, // 'National' or 'Local'
  contractAddress: { type: String, required: true },
  archivedAt: { type: Date, default: Date.now },
  totalValidVotes: { type: Number, default: 0 },
  results: [{
    constituencyId: { type: Number, required: true },
    constituencyName: { type: String, required: true },
    state: { type: String },
    winnerName: { type: String },
    winnerParty: { type: String },
    winnerLogo: { type: String },
    margin: { type: Number },
    totalVotes: { type: Number },
    isUncontested: { type: Boolean, default: false },
    isTie: { type: Boolean, default: false }
  }]
});

const ArchivedElection = mongoose.model('ArchivedElection', archivedElectionSchema);

export default ArchivedElection;
