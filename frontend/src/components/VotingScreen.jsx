import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ResultsDashboard from './ResultsDashboard.jsx';
import StateMapDashboard from './StateMapDashboard.jsx';

// Official ECI-Grade Theme
const S = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc', // Khadi White background
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
  },
  headerBanner: {
    background: 'linear-gradient(135deg, var(--eci-navy) 0%, #1e3a8a 100%)',
    borderTop: '6px solid var(--eci-saffron)',
    borderBottom: '6px solid var(--eci-green)',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    color: '#ffffff',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 128, 0.4)',
    position: 'relative',
    overflow: 'hidden',
  },
  h1: {
    fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
    fontWeight: 800,
    margin: '0 0 0.25rem 0',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: '0.9rem',
    fontWeight: 500,
    margin: 0,
    opacity: 0.9,
  },
  main: {
    flexGrow: 1,
    padding: '3rem 1.5rem',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '16px',
    padding: '3rem',
    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.02)',
    boxSizing: 'border-box',
    backdropFilter: 'blur(12px)',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    color: '#334155',
    marginBottom: '0.5rem',
    fontWeight: 600,
  },
  inputGroup: {
    marginBottom: '1.5rem',
  },
  input: {
    width: '100%',
    padding: '0.85rem 1rem',
    border: '2px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '1rem',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
  },
  btn: {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#000080',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 128, 0.2)',
  },
  btnSecondary: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #ef4444',
    padding: '1rem 1.5rem',
    marginBottom: '2rem',
    color: '#b91c1c',
    fontSize: '0.95rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderLeft: '4px solid #22c55e',
    padding: '1rem 1.5rem',
    marginBottom: '2rem',
    color: '#15803d',
    fontSize: '0.95rem',
    fontWeight: 500,
  },
  evmContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    backgroundColor: '#f1f5f9',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
  },
  evmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
  },
  evmButton: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    padding: '1.5rem',
    borderTop: '1px solid #e2e8f0',
    color: '#64748b',
    fontSize: '0.8rem',
    backgroundColor: '#ffffff',
  },
  // ── VVPAT Receipt Styles ─────────────────────────────────────────────────
  receiptPage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 1rem',
    gap: '1.5rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  receiptBox: {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    border: '4px solid #16a34a',
    borderRadius: '20px',
    padding: '2.5rem 2rem',
    textAlign: 'center',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(22,163,74,0.25)',
    boxSizing: 'border-box',
  },
  receiptIcon: {
    fontSize: '5rem',
    lineHeight: 1,
    marginBottom: '0.75rem',
    display: 'block',
  },
  receiptHindi: {
    fontSize: '1.6rem',
    fontWeight: 900,
    color: '#14532d',
    margin: '0 0 0.25rem 0',
  },
  receiptEnglish: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#16a34a',
    margin: '0 0 1.5rem 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  receiptCandidateBox: {
    background: '#ffffff',
    border: '3px solid #16a34a',
    borderRadius: '14px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    textAlign: 'left',
    marginBottom: '1.5rem',
  },
  receiptCandidateName: {
    fontSize: '1.4rem',
    fontWeight: 900,
    color: '#0f172a',
    lineHeight: 1.2,
  },
  receiptCandidateParty: {
    fontSize: '1rem',
    color: '#475569',
    fontWeight: 600,
    marginTop: '0.3rem',
  },
  receiptArea: {
    fontSize: '1rem',
    color: '#334155',
    fontWeight: 600,
    margin: '0 0 1.25rem 0',
    padding: '0.5rem 1rem',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: '8px',
  },
  receiptCountdown: {
    fontSize: '0.95rem',
    color: '#64748b',
    marginTop: '0.5rem',
  },
  receiptBar: {
    height: '8px',
    background: '#d1fae5',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '0.5rem',
    width: '100%',
  },
  receiptBarFill: {
    height: '100%',
    background: '#16a34a',
    transition: 'width 1s linear',
    borderRadius: '4px',
  },
  receiptTechToggle: {
    fontSize: '0.8rem',
    color: '#64748b',
    cursor: 'pointer',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    marginTop: '0.5rem',
  },
  receiptTechBox: {
    background: '#0f172a',
    color: '#94a3b8',
    borderRadius: '8px',
    padding: '1rem',
    fontSize: '0.72rem',
    fontFamily: 'monospace',
    textAlign: 'left',
    width: '100%',
    maxWidth: '480px',
    boxSizing: 'border-box',
    wordBreak: 'break-all',
    lineHeight: 1.7,
  },
};

export default function VotingScreen() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Election Status — per constituency
  const [isPublished, setIsPublished] = useState(false);
  const [tenderedCount, setTenderedCount] = useState(0);

  // Feedback State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auth Pipeline States
  const [isVerified, setIsVerified] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [userConstituencyId, setUserConstituencyId] = useState(null);
  const [userAreaName, setUserAreaName] = useState('');     // Human-readable name
  const [userWardId, setUserWardId]                 = useState(null);
  const [electionType, setElectionType]             = useState('National');
  const [eligibleVoters, setEligibleVoters] = useState(0);
  const [votedCandidate, setVotedCandidate] = useState(null); // For VVPAT detail

  // Voting State
  const [voteLocked, setVoteLocked] = useState(false);

  // VVPAT State
  const [vvpatReceipt, setVvpatReceipt] = useState(null);
  const [vvpatCountdown, setVvpatCountdown] = useState(7); // 7-second display per ECI mandate

  // Election Phase State
  const [electionPhase, setElectionPhase] = useState(null);
  const [boundaries, setBoundaries] = useState([]);
  const [selectedStateForMap, setSelectedStateForMap] = useState('');
  const [showTechDetails, setShowTechDetails] = useState(false);

  const API_BASE = 'http://localhost:5000/api/voting';

  const fetchElectionData = async (cid) => {
    try {
      if (cid) {
        // Check whether this specific constituency's results have been published
        const statusRes = await axios.get(`${API_BASE}/constituency-status?id=${cid}`);
        setIsPublished(statusRes.data.published);

        const res = await axios.get(`${API_BASE}/candidates?constituencyId=${cid}`);
        setCandidates(res.data);
        const statsRes = await axios.get(`http://localhost:5000/api/constituency/stats?id=${cid}`);
        setEligibleVoters(statsRes.data.totalEligibleVoters || 0);
        
        try {
          const compRes = await axios.get(`http://localhost:5000/api/compliance/form17c?constituencyId=${cid}`);
          setTenderedCount(compRes.data.data.tenderedCount || 0);
        } catch (e) {
          setTenderedCount(0);
        }
      } else {
        // No constituency known yet — reset published flag
        setIsPublished(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchElectionData(userConstituencyId);
    const interval = setInterval(() => fetchElectionData(userConstituencyId), 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [userConstituencyId]);

  // Auto-logout after successful vote (7 seconds per ECI VVPAT mandate)
  useEffect(() => {
    if (vvpatReceipt) {
      setVvpatCountdown(7);
      const countdown = setInterval(() => {
        setVvpatCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            resetVoterSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [vvpatReceipt]);

  // Fetch election phase on mount
  useEffect(() => {
    const fetchPhase = async () => {
      try {
        const res = await axios.get(`${API_BASE}/election-phase`);
        setElectionPhase(res.data);
      } catch { setElectionPhase({ phase: 'Polling', allowVoting: true, label: 'Polling Day' }); }
    };
    const fetchB = async () => {
      try {
        const res = await axios.get(`${API_BASE}/boundaries/all`);
        setBoundaries(res.data);
      } catch(e) { console.error(e); }
    };
    fetchPhase();
    fetchB();
    const interval = setInterval(fetchPhase, 15000);
    return () => clearInterval(interval);
  }, []);

  const resetVoterSession = () => {
    setVvpatReceipt(null);
    setIsVerified(false);
    setAadhaarInput('');
    setOtpInput('');
    setOtpSent(false);
    setVoteLocked(false);
    setUserConstituencyId(null);
    setUserWardId(null);
    setElectionType('National');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTriggerOtp = (e) => {
    e.preventDefault();
    if (aadhaarInput.length !== 12) {
      setErrorMsg("Please enter a valid 12-digit National ID number.");
      return;
    }
    const mockOtp = Math.floor(100000 + Math.random() * 900000);
    setGeneratedOtp(mockOtp);
    setOtpSent(true);
    setErrorMsg('');
    setSuccessMsg(`Verification code sent. (Demo: ${mockOtp})`);
  };

  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    if (otpInput === generatedOtp?.toString()) {
      try {
        const res = await axios.post(`${API_BASE}/verify`, { voterId: aadhaarInput });
        setUserConstituencyId(res.data.areaId);
        setUserAreaName(res.data.areaName || `${res.data.electionType === 'Local' ? 'Ward' : 'Constituency'} ${res.data.areaId}`);
        setUserWardId(res.data.wardId ?? null);
        setElectionType(res.data.electionType || 'National');
        setIsVerified(true);
        setErrorMsg('');
        const labelName = res.data.electionType === 'Local' ? 'Ward' : 'Constituency';
        if (res.data.notInRegistry) {
          setSuccessMsg(`⚠️ Identity verified (demo mode). ${labelName} assigned automatically.`);
        } else {
          setSuccessMsg(`✓ Identity verified. ${labelName} loaded from ECI registry.`);
        }
      } catch(err) {
        setErrorMsg('Backend verification failed: ' + (err.response?.data?.error || err.message));
      }
    } else {
      setErrorMsg('Invalid verification code. Please try again.');
    }
  };

  const handleVote = async (id) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`${API_BASE}/vote`, { 
        candidateId: id, 
        voterId: aadhaarInput,
        constituencyId: userConstituencyId 
      });
      // Find the voted candidate details for VVPAT
      const voted = candidates.find(c => c.id === id);
      setVotedCandidate(voted || null);
      setVvpatReceipt(res.data);
    } catch (err) {
      const statusCode = err.response?.status;
      if (err.response?.data?.isDuplicate || statusCode === 403) {
        setVoteLocked(true);
        setErrorMsg("System Record: A ballot has already been processed for this identifier at this polling station. Please contact the on-duty Presiding Officer if a dispute verification is required.");
      } else {
        setErrorMsg("An error occurred while processing the ballot. Please seek assistance.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <header style={S.headerBanner}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '120%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h1 style={S.h1}>Election Commission of India</h1>
        <p style={{...S.subtitle, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.8rem'}}>Official Digital Polling Terminal</p>
      </header>

      <main style={S.main}>
        {errorMsg && <div style={S.errorBanner}>{errorMsg}</div>}
        {successMsg && <div style={S.successBanner}>{successMsg}</div>}

        {electionPhase?.phase === 'Results' && !userConstituencyId ? (
          selectedStateForMap ? (
            <StateMapDashboard 
              stateName={selectedStateForMap} 
              onBack={() => setSelectedStateForMap('')}
              onSelectConstituency={(id, name) => {
                setUserConstituencyId(id);
                setUserAreaName(name);
                setIsVerified(true);
                setIsPublished(false);
              }}
            />
          ) : (
            <div style={S.card}>
              <h2 style={{ fontSize: '1.4rem', color: '#000080', textAlign: 'center', marginBottom: '1.5rem' }}>
                📊 Public Results Portal
              </h2>
              <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Elections have concluded. Select a State to view its Electoral Map.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{...S.inputGroup, width: '100%', maxWidth: '400px'}}>
                  <label style={S.label}>Select State / Union Territory</label>
                  <select style={{...S.input, padding: '0.75rem', fontSize: '1rem', cursor: 'pointer'}} onChange={e => {
                    const st = e.target.value;
                    if (st) setSelectedStateForMap(st);
                  }}>
                    <option value="">-- Choose State / UT --</option>
                    {[...new Set(boundaries.filter(b => b.type === 'National' && b.state).map(b => b.state))].sort().map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.5rem' }}>
                As per RPA 1951, official results are public domain information.
              </p>
            </div>
          )
        ) : isPublished && !userConstituencyId ? (
          <div style={S.card}>
            <h2 style={{ fontSize: '1.4rem', color: '#000080', textAlign: 'center', marginBottom: '1.5rem' }}>
              Results Published. Verify Identity to View Local Results
            </h2>
            {!otpSent ? (
              <form onSubmit={handleTriggerOtp}>
                <div style={S.inputGroup}>
                  <label style={S.label}>Enter 12-Digit Voter / Aadhaar ID</label>
                  <input type="password" value={aadhaarInput} onChange={(e) => setAadhaarInput(e.target.value)} maxLength={12} style={{...S.input, textAlign: 'center', letterSpacing: '0.2em'}} required />
                </div>
                <button type="submit" style={S.btn}>Proceed</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyIdentity}>
                <div style={S.inputGroup}>
                  <label style={S.label}>Enter Verification Code</label>
                  <input type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} maxLength={6} style={{...S.input, textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem'}} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setOtpSent(false)} style={{...S.btn, ...S.btnSecondary, flex: 1}}>Cancel</button>
                  <button type="submit" style={{...S.btn, flex: 2}}>Authenticate</button>
                </div>
              </form>
            )}
          </div>
        ) : userConstituencyId && (isPublished || electionPhase?.phase === 'Results') ? (
          <div style={{ maxWidth: '960px', margin: '3rem auto' }}>
            <ResultsDashboard
              candidates={candidates}
              resetVoterSession={resetVoterSession}
              eligibleVoters={eligibleVoters}
              isPublished={isPublished}
              tenderedCount={tenderedCount}
            />
          </div>
        ) : vvpatReceipt ? (
          /* Stage 3: VVPAT Voter Receipt — Accessible & Bilingual */
          <div style={S.receiptPage}>
            {/* Main green confirmation box */}
            <div style={S.receiptBox}>
              <span style={S.receiptIcon}>✅</span>
              <h2 style={S.receiptHindi}>आपका वोट पड़ गया!</h2>
              <p style={S.receiptEnglish}>Your Vote Has Been Recorded</p>

              {/* Candidate Detail */}
              {votedCandidate && (
                <div style={S.receiptCandidateBox}>
                  {votedCandidate.logoUrl ? (
                    <img
                      src={votedCandidate.logoUrl}
                      alt={votedCandidate.partySymbol}
                      style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0, border: '2px solid #e2e8f0' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>🗳️</div>
                  )}
                  <div>
                    <div style={S.receiptCandidateName}>{votedCandidate.name}</div>
                    <div style={S.receiptCandidateParty}>{votedCandidate.partySymbol || 'Independent / Nirdaliya'}</div>
                  </div>
                </div>
              )}

              {/* Area info */}
              <div style={S.receiptArea}>
                🏛️ {userAreaName}
              </div>

              {/* Countdown bar */}
              <div style={S.receiptCountdown}>
                यह पर्ची <strong style={{ fontSize: '1.3rem', color: '#dc2626' }}>{vvpatCountdown}</strong> सेकंड में बंद होगी
                <br />
                <span style={{ fontSize: '0.8rem' }}>Screen closes in {vvpatCountdown} second{vvpatCountdown !== 1 ? 's' : ''}</span>
              </div>
              <div style={S.receiptBar}>
                <div style={{ ...S.receiptBarFill, width: `${(vvpatCountdown / 7) * 100}%` }} />
              </div>

              {/* Tech toggle — hidden by default */}
              <button style={S.receiptTechToggle} onClick={() => setShowTechDetails(v => !v)}>
                {showTechDetails ? '▲ Hide Technical Details' : '▼ Technical Verification Details'}
              </button>
            </div>

            {/* Technical Details — collapsed by default, for observers/admin */}
            {showTechDetails && (
              <div style={S.receiptTechBox}>
                <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: '0.5rem' }}>🔗 Blockchain Audit Record</div>
                {vvpatReceipt.txHash && <div>TX Hash: {vvpatReceipt.txHash}</div>}
                {vvpatReceipt.blockNumber && <div>Block: #{vvpatReceipt.blockNumber}</div>}
                {vvpatReceipt.nullifier && <div>Nullifier: {vvpatReceipt.nullifier?.slice(0, 32)}...</div>}
                {vvpatReceipt.isChallenge && <div style={{ color: '#f59e0b', marginTop: '0.5rem' }}>⚠ CHALLENGE BALLOT — Refer to Presiding Officer</div>}
              </div>
            )}
          </div>
        ) : electionPhase && !electionPhase.allowVoting ? (
          /* Pre/Post Polling State */
          <div style={{ ...S.card, textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{electionPhase.icon || '⏳'}</div>
            <h2 style={{ fontSize: '1.5rem', color: '#000080', marginBottom: '1rem' }}>
              {electionPhase.label || 'Election Phase'}
            </h2>
            <p style={{ color: '#475569', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
              {electionPhase.desc || 'Voting is currently closed.'}
            </p>
          </div>
        ) : !isVerified ? (
          /* Stage 1: Identity Verification */
          <div style={S.card} className="glass-card animate-slide-up glow-border">
            <h2 style={{ fontSize: '1.5rem', color: 'var(--eci-navy)', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem', fontWeight: 900, textAlign: 'center' }}>
              Secure Identity Gateway
            </h2>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '0.6rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <Link to="/archive" style={{ color: '#1d4ed8', fontWeight: 800, fontSize: '0.92rem', textDecoration: 'none' }}>
                📜 पिछले चुनाव के नतीजे देखें / View Past Election Results
              </Link>
            </div>
            
            {!otpSent ? (
              <form onSubmit={handleTriggerOtp}>
                <div style={S.inputGroup}>
                  <label style={S.label}>Enter 12-Digit Voter / Aadhaar ID</label>
                  <input
                    type="password"
                    value={aadhaarInput}
                    onChange={(e) => setAadhaarInput(e.target.value)}
                    maxLength={12}
                    style={{...S.input, textAlign: 'center', letterSpacing: '0.2em'}}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button type="submit" className="btn-primary hover-scale" style={{...S.btn, padding: '1rem 3rem'}}>
                    Initiate Secure Session →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyIdentity} className="animate-slide-up">
                <div style={S.inputGroup}>
                  <label style={S.label}>Enter Verification Code</label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={6}
                    style={{...S.input, textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem'}}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setOtpSent(false)} style={{...S.btn, ...S.btnSecondary, flex: 1}}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{...S.btn, flex: 2}}>Authenticate Securely</button>
                </div>
              </form>
            )}
          </div>
        ) : voteLocked ? (
          /* Stage 4: Duplicate Rejection */
          <div style={{...S.card, borderColor: '#ef4444'}}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#b91c1c', margin: '0 0 0.5rem 0' }}>
                Booth Session Locked
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                This voting session has been sealed. If you believe this is an error, contact the Presiding Officer to submit a Challenge Ballot via the Department Portal.
              </p>
              <button type="button" onClick={resetVoterSession} style={{...S.btn, ...S.btnSecondary, marginTop: '1.5rem'}}>
                Return to Login
              </button>
            </div>
          </div>
        ) : (
          /* Stage 2: EVM Ballot Sheet */
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000080', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', color: '#000080', margin: 0 }}>
                  {electionType === 'Local' ? `🏙️ Ward — ${userAreaName}` : `🏛️ Constituency — ${userAreaName}`}
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                  {electionType === 'Local' ? 'Local Body Election' : 'Parliamentary / Assembly Election'}
                </p>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 'bold' }}>READY</span>
            </div>
            
            <div style={S.evmContainer}>
              {candidates.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Ballot not configured.</p>
              )}
              {candidates.map((c, idx) => (
                <div key={c.id} style={S.evmRow} className="evm-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', opacity: c.isWithdrawn ? 0.4 : 1 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#64748b', width: '24px', textAlign: 'center' }}>{idx + 1}</span>
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.partySymbol} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', filter: c.isWithdrawn ? 'grayscale(100%)' : 'none' }} />
                    ) : (
                      <div style={{ width: '44px', height: '44px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', filter: c.isWithdrawn ? 'grayscale(100%)' : 'none' }}>🍎</div>
                    )}
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, textTransform: 'uppercase', textDecoration: c.isWithdrawn ? 'line-through' : 'none' }}>{c.name}</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>{c.partySymbol || 'Independent'}</div>
                      {c.isWithdrawn && <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>CANDIDATURE WITHDRAWN</div>}
                      {c.switched && !c.isWithdrawn && <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>Party Switched → Post-election</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <div style={{ color: c.isWithdrawn ? '#94a3b8' : '#ef4444', fontSize: '1.5rem', fontWeight: 'bold' }}>→</div>
                     <button
                       disabled={loading || c.isWithdrawn}
                       onClick={() => handleVote(c.id)}
                       className="evm-btn"
                       style={{ ...S.evmButton, cursor: c.isWithdrawn ? 'not-allowed' : 'pointer' }}
                       aria-label={`Vote for ${c.name}`}
                     />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Public Audit Ledger Footer */}
      <footer style={S.footer}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontWeight: 500 }}>
          <span>Total Secure Ballots Sealed: {candidates.reduce((sum, c) => sum + c.voteCount, 0)}</span>
          <span>|</span>
          <span style={{ color: '#16a34a' }}>Node Status: Operational</span>
          <span>|</span>
          <span style={{ color: '#16a34a' }}>Network Sync: 100%</span>
        </div>
      </footer>
    </div>
  );
}
