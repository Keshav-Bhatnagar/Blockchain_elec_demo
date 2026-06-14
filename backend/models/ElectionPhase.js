/**
 * ElectionPhase.js
 * Manages the election lifecycle phases as per ECI constitutional procedure.
 * 
 * Real-world pipeline (Representation of the People Act, 1951):
 *   1. Pre-Notification  → ECI planning stage
 *   2. Notification       → Gazette notification issued, MCC activates
 *   3. Nomination         → Candidates file papers with RO (Section 33)
 *   4. Scrutiny           → RO examines nominations (Section 36)
 *   5. Withdrawal         → Candidates may withdraw (Section 37)
 *   6. Campaigning        → Public campaign period (ends 48h before poll)
 *   7. SilencePeriod      → 48 hours before polling — no campaigning
 *   8. Polling            → Voting day — EVM + VVPAT
 *   9. Counting           → Votes tallied under RO supervision
 *  10. Results            → Winner declared, results sealed on-chain
 */
import mongoose from 'mongoose';

const PHASES = [
  'PreNotification',
  'Notification',
  'Nomination',
  'Scrutiny',
  'Withdrawal',
  'Campaigning',
  'SilencePeriod',
  'Polling',
  'Counting',
  'Results'
];

const PHASE_INFO = {
  PreNotification: { label: 'Pre-Notification', icon: '📋', desc: 'ECI planning and preparation stage. Electoral rolls being finalized.', allowVoting: false, allowNomination: false },
  Notification:    { label: 'Election Notified', icon: '📰', desc: 'Gazette notification issued. Model Code of Conduct (MCC) is now in effect.', allowVoting: false, allowNomination: false },
  Nomination:      { label: 'Nomination Period', icon: '📝', desc: 'Candidates may file nomination papers with the Returning Officer (Section 33, RPA 1951).', allowVoting: false, allowNomination: true },
  Scrutiny:        { label: 'Scrutiny of Nominations', icon: '🔍', desc: 'RO examines all filed nominations for legal compliance (Section 36, RPA 1951).', allowVoting: false, allowNomination: false },
  Withdrawal:      { label: 'Withdrawal Period', icon: '↩️', desc: 'Last opportunity for candidates to withdraw their nomination (Section 37, RPA 1951).', allowVoting: false, allowNomination: false },
  Campaigning:     { label: 'Campaign Period', icon: '📢', desc: 'Active campaigning underway. MCC in full effect. Campaign expenditure monitored.', allowVoting: false, allowNomination: false },
  SilencePeriod:   { label: '48-Hour Silence', icon: '🤫', desc: 'All campaigning has ceased 48 hours before polling as per ECI mandate.', allowVoting: false, allowNomination: false },
  Polling:         { label: 'Polling Day', icon: '🗳️', desc: 'Voting is LIVE. EVMs and VVPAT machines operational at all polling stations.', allowVoting: true, allowNomination: false },
  Counting:        { label: 'Vote Counting', icon: '🔢', desc: 'Counting underway under RO supervision. VVPAT verification of 5 random stations per segment.', allowVoting: false, allowNomination: false },
  Results:         { label: 'Results Declared', icon: '🏆', desc: 'Official results published. Winners declared. Election process complete.', allowVoting: false, allowNomination: false },
};

const electionPhaseSchema = new mongoose.Schema({
  // Only one active election at a time — use a fixed _id
  _id:         { type: String, default: 'active_election' },
  phase:       { type: String, enum: PHASES, default: 'PreNotification' },
  electionName:{ type: String, default: 'General Election 2026' },
  electionType:{ type: String, enum: ['LokSabha', 'VidhanSabha', 'National', 'Local'], default: 'LokSabha' },
  notifiedAt:  { type: Date },
  nominationStart: { type: Date },
  nominationEnd:   { type: Date },
  scrutinyDate:    { type: Date },
  withdrawalEnd:   { type: Date },
  pollingDate:     { type: Date },
  countingDate:    { type: Date },
  updatedAt:       { type: Date, default: Date.now },
}, { _id: false });

const ElectionPhase = mongoose.models.ElectionPhase || mongoose.model('ElectionPhase', electionPhaseSchema);

export { PHASES, PHASE_INFO };
export default ElectionPhase;
