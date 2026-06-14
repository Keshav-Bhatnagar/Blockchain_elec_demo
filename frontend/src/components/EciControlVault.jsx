import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/voting';

const S = {
  page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a', display: 'flex', flexDirection: 'column' },
  headerBanner: { backgroundColor: '#000080', borderTop: '6px solid #FF9933', borderBottom: '6px solid #138808', padding: '1.5rem', textAlign: 'center', color: '#ffffff' },
  main: { flexGrow: 1, padding: '2.5rem 1.5rem', maxWidth: '860px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },
  card: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', marginBottom: '2rem', boxSizing: 'border-box' },
  section: { fontSize: '1.1rem', fontWeight: 700, color: '#000080', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '0.875rem', color: '#334155', marginBottom: '0.4rem', fontWeight: 600 },
  inputGroup: { marginBottom: '1.25rem' },
  input: { width: '100%', padding: '0.8rem 1rem', border: '2px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.8rem 1rem', border: '2px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '0.9rem', backgroundColor: '#000080', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' },
  btnOrange: { backgroundColor: '#ea580c' },
  btnGray: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
  btnDanger: { backgroundColor: '#ef4444' },
  error: { backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '0.9rem 1.2rem', marginBottom: '1.5rem', color: '#b91c1c', fontSize: '0.9rem' },
  success: { backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e', padding: '0.9rem 1.2rem', marginBottom: '1.5rem', color: '#15803d', fontSize: '0.9rem' },
  partyPill: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: '99px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', margin: '0.25rem', fontSize: '0.85rem', fontWeight: 600 },
  partyLogo: { width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#e2e8f0' },
};

export default function EciControlVault() {
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('CentralAdmin'); // Default tab for Tester
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Custom Axios wrapper to include JWT
  const authAxios = axios.create();
  authAxios.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Party form
  const [pName, setPName] = useState('');
  const [pColor, setPColor] = useState('#94a3b8');
  const [pLogo, setPLogo] = useState('');   // final hosted URL
  const [pLogoFile, setPLogoFile] = useState(null); // local File object for preview
  const [logoUploading, setLogoUploading] = useState(false);

  // Candidate form
  const [cName, setCName] = useState('');
  const [cPartyId, setCPartyId] = useState('');
  const [cConstId, setCConstId] = useState('');
  const [cProposerCount, setCProposerCount] = useState('');
  const [newCandidate, setNewCandidate] = useState({ name: '', partyId: '', customPartyName: '', customLogo: null, age: '', occupation: '', assets: '' });
  
  // Progress Bar for Simulation
  const [simProgress, setSimProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simInterval, setSimInterval] = useState(null);
  const [cCandidates, setCCandidates] = useState([]);

  // Challenge vote form
  const [chConstId, setChConstId] = useState('');
  const [chVoterId, setChVoterId] = useState('');
  const [chCandId, setChCandId] = useState('');

  // OSM Utility
  const [osmCity, setOsmCity] = useState('');
  const [osmLoading, setOsmLoading] = useState(false);

  // Tendered ballot form
  const [tdConstId, setTdConstId] = useState('');
  const [tdVoterId, setTdVoterId] = useState('');
  const [tdCandId, setTdCandId] = useState('');

  // Party switch form
  const [swConstId, setSwConstId] = useState('');
  const [swCandId, setSwCandId] = useState('');
  const [swNewParty, setSwNewParty] = useState('');

  // Publish results form
  const [pubConstId, setPubConstId] = useState('');
  const [pubState, setPubState] = useState('');

  // Voter form
  const [vVoterId, setVVoterId] = useState('');
  const [vBulkCount, setVBulkCount] = useState(1000); // Default bulk count
  const [bulkLoading, setBulkLoading] = useState(false);
  const [vConstId, setVConstId] = useState('');
  const [vWardId, setVWardId] = useState('');
  const [voterCount, setVoterCount] = useState(null); // total registered count

  // Boundary form
  const [geoId, setGeoId] = useState('');
  const [geoName, setGeoName] = useState('');
  const [electionType, setElectionType] = useState('0'); // '0' for National, '1' for Local
  const [electionSubtype, setElectionSubtype] = useState('LokSabha'); // Granular type
  const [boundaries, setBoundaries] = useState([]);
  const [constSearch, setConstSearch] = useState(''); // Constituency search filter

  // Dynamic fetch will populate the `boundaries` state array
  const [electionPhaseData, setElectionPhaseData] = useState(null);

  const notify = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 5000); };

  const fetchParties = async () => {
    try {
      const res = await axios.get(`${API}/parties`);
      setParties(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchVoterCount = async () => {
    try {
      const res = await authAxios.get('http://localhost:5000/api/admin/voters');
      setVoterCount(res.data.count);
    } catch { /* silently ignore */ }
  };

  const fetchBoundaries = async () => {
    try {
      const allRes = await axios.get('http://localhost:5000/api/voting/boundaries/all');
      setBoundaries(allRes.data);
      
      const res = await axios.get(`${API}/boundaries`);
      // Safe evaluation of election type property
      if (res.data && res.data.electionType) {
        setElectionType(res.data.electionType === 'National' ? '0' : '1');
      } else {
        setElectionType('0'); // Fallback: Default to National Model if string is corrupted
      }
    } catch (e) { 
      console.error("Blockchain sync failed, matching to default offline cache:", e);
      setElectionType('0'); // Fallback gracefully instead of throwing BAD_DATA
    }
  };
  const fetchElectionPhase = async () => {
    try {
      const res = await authAxios.get('http://localhost:5000/api/admin/election-phase');
      setElectionPhaseData(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { if (isAuth) { fetchParties(); fetchVoterCount(); fetchBoundaries(); fetchElectionPhase(); } }, [isAuth]);

  const doAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API.replace('/voting', '/auth')}/login`, { username, password, employeeId });
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuth(true);
      setMsg({ type: '', text: '' });
      // If ReturningOfficer, look up their actual geoId from boundaries
      if (res.data.user.role === 'ReturningOfficer') {
        const zone = res.data.user.assignedZone;
        // assignedZone IS already the geoId (1-543 sequential)
        setCConstId(String(zone));
      }
    } catch (err) {
      notify('error', err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const doUploadLogo = async (file) => {
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append('logo', file);
      const res = await axios.post(`${API}/upload-logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPLogo(res.data.logoUrl);
      notify('success', 'Logo uploaded successfully.');
    } catch (err) {
      notify('error', 'Logo upload failed: ' + (err.response?.data?.error || err.message));
      setPLogo('');
    } finally {
      setLogoUploading(false);
    }
  };

  const doRegisterParty = async (e) => {
    e.preventDefault();
    if (!pLogo) { notify('error', 'Please upload a party logo first.'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/register-party`, { name: pName, logoUrl: pLogo, colorHex: pColor, adminSecret: password });
      notify('success', `Party "${pName}" registered on-chain.`);
      setPName(''); setPColor('#94a3b8'); setPLogo(''); setPLogoFile(null);
      fetchParties();
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };

  const doAddCandidate = async (e) => {
    e.preventDefault();
    
    // RPA 1951 Section 33 Proposer Validation
    const isIndependent = parties.find(p => p.id === Number(cPartyId))?.name === 'Independent';
    const requiredProposers = isIndependent ? 10 : 1;
    if (Number(cProposerCount) < requiredProposers) {
      notify('error', `RPA 1951 Violation: ${isIndependent ? 'Independent' : 'Party'} candidates require at least ${requiredProposers} proposer(s).`);
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/candidates`, { name: cName, partyId: cPartyId, constituencyId: cConstId, adminSecret: password });
      notify('success', `Candidate "${cName}" registered to ledger.`);
      setCName(''); setCPartyId('');
      if (cConstId) fetchCCandidates(cConstId);
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };

  const fetchCCandidates = async (constId) => {
    try {
      const res = await axios.get(`${API}/candidates?constituencyId=${constId}`);
      setCCandidates(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (cConstId) fetchCCandidates(cConstId);
    else setCCandidates([]);
  }, [cConstId]);

  const doWithdrawCandidate = async (candidateId) => {
    if(!window.confirm(`Are you sure you want to withdraw this candidate? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await axios.post(`${API}/candidates/withdraw`, { constituencyId: cConstId, candidateId, adminSecret: password });
      notify('success', `Candidate withdrawn successfully.`);
      fetchCCandidates(cConstId);
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };

  const doChallenge = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAxios.post(`${API}/challenge-vote`, { constituencyId: chConstId, candidateId: chCandId, voterId: chVoterId, adminSecret: password });
      notify('success', `Challenge Ballot minted for candidate #${chCandId}.`);
      setChConstId(''); setChVoterId(''); setChCandId('');
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };

  const doTenderedBallot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAxios.post(`${API}/tendered-vote`, { constituencyId: tdConstId, candidateId: tdCandId, voterId: tdVoterId, adminSecret: password });
      notify('success', `Tendered Ballot authorized. Nullifier: ${res.data.nullifier.slice(0, 8)}...`);
      setTdConstId(''); setTdVoterId(''); setTdCandId('');
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };

  const doSwitchParty = async (e) => {
    e.preventDefault();
    if (!window.confirm("Confirm post-election party switch? This action is permanently recorded on-chain.")) return;
    setLoading(true);
    try {
      await axios.post(`${API}/switch-party`, { constituencyId: swConstId, candidateId: swCandId, newPartyId: swNewParty, adminSecret: password });
      notify('success', `Party affiliation updated. Defection logged on-chain.`);
      setSwConstId(''); setSwCandId(''); setSwNewParty('');
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };

  const doOnboardVoter = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/admin/onboard-voter', {
        voterId: vVoterId,
        constituencyId: vConstId,
        wardId: vWardId,
        adminSecret: password,
      });
      notify('success',
        `✓ Voter onboarded → Constituency ${res.data.constituencyId}, Ward ${res.data.wardId}. ` +
        `Hash: ${res.data.identityHash.slice(0, 16)}…`
      );
      setVVoterId('');
      fetchVoterCount();
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };

  const doBulkOnboard = async (e) => {
    e.preventDefault();
    if(!vConstId || !vWardId) { notify('error', 'Select Constituency and Ward first.'); return; }
    if(!window.confirm(`Simulate mass database sync of ${vBulkCount} voters from Electoral Roll?`)) return;
    
    setBulkLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/admin/bulk-onboard', {
        constituencyId: vConstId,
        wardId: vWardId,
        count: vBulkCount,
        adminSecret: password,
      });
      notify('success', `✓ Electoral Roll Synced: ${res.data.addedCount} voters seeded successfully.`);
      fetchVoterCount();
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setBulkLoading(false); }
  };

  const doSetElectionType = async (type) => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/admin/election-type', {
        electionType: Number(type),
        adminSecret: password,
      });
      setElectionType(type);
      notify('success', `Election scope updated to ${type === '0' ? 'National (Constituencies)' : 'Local (Wards)'}.`);
      fetchBoundaries();
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };

  const doAddGeography = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = electionType === '0' ? 'constituency' : 'ward';
      await axios.post(`http://localhost:5000/api/admin/${endpoint}`, {
        id: geoId,
        name: geoName,
        adminSecret: password,
      });
      notify('success', `✓ ${electionType === '0' ? 'Constituency' : 'Ward'} registered successfully.`);
      setGeoId('');
      setGeoName('');
      fetchBoundaries();
    } catch (err) { notify('error', err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };

  const doPublishResults = async () => {
    if (pubConstId === 'ALL') {
      if (!window.confirm(`🚨 WARNING: Are you sure you want to publish ALL results ${pubState ? `in ${pubState}` : 'nationwide'}? This will permanently seal voting for all selected constituencies.`)) return;
      setLoading(true);
      try {
        const cids = boundaries.filter(b => b.type === 'National' && (pubState === '' || b.state === pubState)).map(b => b.geoId);
        const res = await axios.post('http://localhost:5000/api/admin/publish-results-bulk', {
          constituencyIds: cids,
          adminSecret: password,
        });
        notify('success', `Bulk publish complete: ${res.data.publishedCount} published, ${res.data.skippedCount} skipped.`);
      } catch (err) { notify('error', err.response?.data?.error || err.message); }
      finally { setLoading(false); }
    } else {
      if (!window.confirm(`Publish official results for constituency #${pubConstId}? Voting will be permanently sealed.`)) return;
      setLoading(true);
      try {
        await axios.post('http://localhost:5000/api/admin/publish-results', {
          constituencyId: pubConstId,
          adminSecret: password,
        });
        notify('success', `Results for constituency #${pubConstId} sealed and published on-chain.`);
      } catch (err) { notify('error', err.response?.data?.error || err.message); }
      finally { setLoading(false); }
    }
  };

  const doFetchOSM = async (e) => {
    e.preventDefault();
    setOsmLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await axios.get(`http://localhost:5000/api/voting/boundaries/live?cityName=${osmCity}`);
      setBoundaries(prev => {
        // Append newly fetched OSM wards to the existing database list without wiping
        return [...prev, ...res.data.boundaries];
      });
      notify('success', `Fetched ${res.data.totalCount} live OSM wards for ${osmCity}!`);
    } catch (err) {
      notify('error', err.response?.data?.error || err.message);
    } finally {
      setOsmLoading(false);
    }
  };

  const roleLabel = {
    'CentralAdmin': 'Central Election Commission',
    'ReturningOfficer': `Returning Officer (Zone ${user?.assignedZone})`,
    'ElectoralOfficer': `Electoral Registration Officer (Zone ${user?.assignedZone})`,
    'PresidingOfficer': `Presiding Officer (Zone ${user?.assignedZone})`,
    'Tester': '🎯 Full-System Master Tester Node (Tab-Wise Access)'
  };

  // ── Login Gate ────────────────────────────────────────────────────────────
  if (!isAuth) return (
    <div style={S.page}>
      <header style={S.headerBanner}><h1>ECI Department Authorization Gateway</h1></header>
      <main style={S.main}>
        <div style={{ ...S.card, maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#000080', marginBottom: '1.5rem', textAlign: 'center' }}>Secure Login Terminal</h2>
          {msg.text && <div style={msg.type === 'error' ? S.error : S.success}>{msg.text}</div>}
          <form onSubmit={doAuth}>
            <div style={S.inputGroup}>
              <label style={S.label}>Employee ID</label>
              <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="e.g. ECI-2026-HQ-001" style={S.input} required />
            </div>
            <div style={S.inputGroup}>
              <label style={S.label}>Department Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter assigned handle" style={S.input} required />
            </div>
            <div style={S.inputGroup}>
              <label style={S.label}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={S.input} required />
            </div>
            <button type="submit" disabled={loading} style={S.btn}>
              {loading ? 'Verifying Credentials...' : 'Authenticate'}
            </button>
          </form>
          {/* Demo Quick-Login Hints */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.6rem', fontWeight: 600 }}>⚡ Quick Demo Logins</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[
                { label: '🏛️ Central Admin', u: 'central_admin', p: 'password123', e: 'ECI-2026-HQ-001' },
                { label: '🗳️ Returning Officer', u: 'ro_amritsar_1', p: 'password123', e: 'ECI-2026-RO-101' },
                { label: '🪪 Electoral Officer', u: 'ero_amritsar_1', p: 'password123', e: 'ECI-2026-ERO-101' },
                { label: '⚖️ Presiding Officer', u: 'po_amritsar_1', p: 'password123', e: 'ECI-2026-PO-101' },
                { label: '🎯 Tester (All)', u: 'role_tester', p: 'password123', e: 'ECI-2026-TEST-999' },
              ].map(d => (
                <button key={d.u} onClick={() => { setUsername(d.u); setPassword(d.p); setEmployeeId(d.e); }}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );

  // ── Dashboard Layout (Authenticated Views Only) ───────────────────────────
  return (
    <div style={S.page}>
      <header style={S.headerBanner}>
        <h1>ECI Command Panel</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', opacity: 0.85 }}>{roleLabel[user?.role] || 'Election Management Console'}</p>
      </header>
      <main style={S.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            {/* ── TESTER NAVIGATION TABS ────────────────── */}
            {user?.role === 'Tester' && (
              <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#e2e8f0', padding: '0.4rem', borderRadius: '8px' }}>
                {['CentralAdmin', 'ReturningOfficer', 'ElectoralOfficer', 'PresidingOfficer'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      backgroundColor: activeTab === tab ? '#000080' : 'transparent',
                      color: activeTab === tab ? '#ffffff' : '#475569',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab === 'CentralAdmin' && '🏛️ Dept A'}
                    {tab === 'ReturningOfficer' && '🗳️ Dept B'}
                    {tab === 'ElectoralOfficer' && '🪪 Dept C'}
                    {tab === 'PresidingOfficer' && '⚖️ Dept D'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setIsAuth(false); setToken(''); setUser(null); }} style={S.btnGray}>End Session</button>
        </div>
        {msg.text && <div style={msg.type === 'error' ? S.error : S.success}>{msg.text}</div>}

        {/* ── DEPT A: CENTRAL ADMIN VIEW ──────────────────────── */}
        {((user?.role === 'CentralAdmin') || (user?.role === 'Tester' && activeTab === 'CentralAdmin')) && (
          <>
            {/* OSM Live Fetcher (Tester Only) */}
            {user?.role === 'Tester' && electionType === '1' && (
              <div style={{ ...S.card, borderColor: '#3b82f6', borderTopWidth: '4px', marginBottom: '2rem' }}>
                <h2 style={{ ...S.section, color: '#1d4ed8' }}>🌍 Live OpenStreetMap Extraction (Tester Utility)</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Enter any Indian city to dynamically fetch genuine regional municipal subdivisions via Overpass API.</p>
                <form onSubmit={doFetchOSM} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ ...S.inputGroup, margin: 0, flexGrow: 1 }}>
                    <label style={S.label}>City Name</label>
                    <input type="text" value={osmCity} onChange={e => setOsmCity(e.target.value)} placeholder="e.g. Amritsar" style={S.input} required />
                  </div>
                  <button type="submit" disabled={osmLoading} style={{ ...S.btn, margin: 0, backgroundColor: '#3b82f6' }}>
                    {osmLoading ? 'Extracting...' : 'Fetch Live OSM Wards'}
                  </button>
                </form>
              </div>
            )}
            {/* Section: Election Phase Manager */}
            {electionPhaseData && (
              <div style={{ ...S.card, borderColor: '#3b82f6', borderTopWidth: '4px' }}>
                <h2 style={{ ...S.section, color: '#1d4ed8' }}>⏳ Election Phase Control (Pipeline Management)</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{electionPhaseData.icon}</div>
                    <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.2rem' }}>{electionPhaseData.label}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', lineHeight: 1.5 }}>{electionPhaseData.desc}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Phase {electionPhaseData.phaseIndex + 1} of {electionPhaseData.totalPhases}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        {electionPhaseData.phaseIndex < electionPhaseData.totalPhases - 1 && (
                          <button 
                            onClick={async () => {
                              setLoading(true);
                              try {
                                const res = await authAxios.post('http://localhost:5000/api/admin/election-phase/advance', { adminSecret: password });
                                setElectionPhaseData(res.data);
                                notify('success', `Advanced to Phase: ${res.data.label}`);
                              } catch (e) {
                                notify('error', e.response?.data?.error || 'Failed to advance phase');
                              }
                              setLoading(false);
                            }} 
                            disabled={loading} 
                            style={{ ...S.btn, backgroundColor: '#3b82f6', margin: 0, padding: '0.6rem 1.2rem', width: 'auto' }}
                          >
                            Advance to Next Phase ⏭️
                          </button>
                        )}
                        {electionPhaseData.phase === 'Results' && (
                          <button 
                            onClick={async () => {
                              if(!window.confirm('Archive results for this election term? This will pull all results from the blockchain and save them permanently to the public archive list.')) return;
                              setLoading(true);
                              try {
                                const res = await authAxios.post('http://localhost:5000/api/admin/archive-election', { adminSecret: password });
                                notify('success', `✓ Successfully archived ${res.data.count} constituency results!`);
                              } catch (e) {
                                notify('error', e.response?.data?.error || 'Failed to archive election');
                              }
                              setLoading(false);
                            }} 
                            disabled={loading} 
                            style={{ ...S.btn, backgroundColor: '#16a34a', margin: '0 0 0.5rem 0', padding: '0.5rem 1rem', width: 'auto', fontSize: '0.85rem' }}
                          >
                            📦 Archive Current Election Term
                          </button>
                        )}
                        <button 
                          onClick={async () => {
                            if(!window.confirm('Reset election back to Phase 1 (Pre-Notification)?')) return;
                            setLoading(true);
                            try {
                              await authAxios.post('http://localhost:5000/api/admin/election-phase/reset', { adminSecret: password });
                              fetchElectionPhase();
                              notify('success', `Election reset to Phase 1.`);
                            } catch (e) {
                              notify('error', e.response?.data?.error || 'Failed to reset phase');
                            }
                            setLoading(false);
                          }} 
                          disabled={loading} 
                          style={{ ...S.btn, backgroundColor: '#ef4444', margin: 0, padding: '0.4rem 1rem', width: 'auto', fontSize: '0.8rem' }}
                        >
                          🔄 Reset Election Cycle
                        </button>
                        {user?.role === 'Tester' && (
                          <div style={{ marginTop: '0.5rem', width: '100%' }}>
                            {!isSimulating ? (
                              <button 
                                onClick={async () => {
                                  if(!window.confirm('Run realistic 2024 election simulation? This will mint 5 real constituencies with random blockchain votes. It takes ~1.5 minutes.')) return;
                                  
                                  setLoading(true);
                                  setIsSimulating(true);
                                  setSimProgress(0);
                                  
                                  // Fake progress animation taking ~90 seconds (1% per second)
                                  const timer = setInterval(() => {
                                    setSimProgress(prev => {
                                      if (prev >= 98) return 98; // Hold at 98% until server replies
                                      return prev + 1.2; 
                                    });
                                  }, 1000);

                                  try {
                                    const res = await authAxios.post('http://localhost:5000/api/admin/simulate-election', { adminSecret: password });
                                    
                                    clearInterval(timer);
                                    setSimProgress(100); // Snap to 100% on success
                                    notify('success', res.data.message || `Simulation & Auto-publish complete!`);
                                    fetchElectionPhase(); // Refresh the phase to show 'Results Declared'
                                    
                                    setTimeout(() => setIsSimulating(false), 3000); // Hide after 3s
                                  } catch (e) {
                                    clearInterval(timer);
                                    setIsSimulating(false);
                                    notify('error', e.response?.data?.error || 'Failed to start simulation');
                                  }
                                  setLoading(false);
                                }} 
                                disabled={loading} 
                                style={{ ...S.btn, backgroundColor: '#8b5cf6', margin: 0, padding: '0.4rem 1rem', width: '100%', fontSize: '0.8rem', boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}
                              >
                                🧪 Run Realistic Election Simulation
                              </button>
                            ) : (
                              <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                                  <span>⚙️ Executing Blockchain TXs...</span>
                                  <span>{Math.floor(simProgress)}%</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${simProgress}%`, height: '100%', backgroundColor: '#8b5cf6', transition: 'width 0.5s ease-out', borderRadius: '4px' }} />
                                </div>
                                {simProgress === 100 && <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.25rem', textAlign: 'center' }}>✓ Published Successfully!</div>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                  </div>
                </div>

                {/* Progress Bar Visualizer */}
                <div style={{ position: 'relative', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '2rem', marginBottom: '2rem' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: '#3b82f6', borderRadius: '3px', width: `${(electionPhaseData.phaseIndex / (electionPhaseData.totalPhases - 1)) * 100}%`, transition: 'width 0.5s ease-in-out' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', top: '-6px', width: '100%' }}>
                    {electionPhaseData.allPhases?.map((p, i) => (
                      <div key={p.key} title={p.label} style={{ 
                        width: '18px', height: '18px', borderRadius: '50%', 
                        background: i <= electionPhaseData.phaseIndex ? '#3b82f6' : '#fff', 
                        border: `3px solid ${i <= electionPhaseData.phaseIndex ? '#3b82f6' : '#cbd5e1'}`,
                        boxShadow: '0 0 0 4px #fff'
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ ...S.card, borderTop: '4px solid #10b981' }}>
              <h2 style={S.section}>⚙️ Active Election Context</h2>
              
              {/* Constitutional Authority Display */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px' }}>
                <p style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600, margin: '0 0 0.5rem' }}>
                  📜 Constitutional Authority: Article 324 — Election Commission of India
                </p>
                <p style={{ fontSize: '0.78rem', color: '#78716c', margin: 0, lineHeight: 1.5 }}>
                  ECI conducts elections to Parliament (Lok Sabha & Rajya Sabha), State Legislatures (Vidhan Sabha), and offices of President & Vice President. 
                  Municipal & Panchayat elections are conducted by State Election Commissions (SEC) under Articles 243K & 243ZA.
                </p>
              </div>

              {/* Election Type Selector — ECI jurisdiction only */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={S.label}>Select Election Type (ECI Jurisdiction)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {[
                    { value: 'LokSabha', label: '🏛️ Lok Sabha (MP)', desc: '543 Parliamentary Constituencies' },
                    { value: 'VidhanSabha', label: '🏢 Vidhan Sabha (MLA)', desc: 'State Assembly Constituencies' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                      padding: '0.6rem 0.8rem', border: `2px solid ${electionSubtype === opt.value ? '#000080' : '#e2e8f0'}`,
                      borderRadius: '6px', backgroundColor: electionSubtype === opt.value ? '#eef2ff' : '#fff',
                      fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s'
                    }}>
                      <input type="radio" name="electionSubtype" value={opt.value} checked={electionSubtype === opt.value}
                        onChange={() => { setElectionSubtype(opt.value); setConstSearch(''); }}
                        disabled={loading} style={{ accentColor: '#000080' }} />
                      <div>
                        <div>{opt.label}</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 400, color: '#64748b' }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem', fontStyle: 'italic' }}>
                  Note: Municipal & Panchayat elections fall under SEC jurisdiction and are not part of this ECI simulation.
                </p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderLeft: '4px solid #10b981', borderRadius: '4px', marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '0.5rem' }}>📊 Live System Geography Status</h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                  The framework is successfully coupled to the automated database and OSM fallback pipeline. 
                  Manual registration has been disabled to prevent duplicate key integrity violations.
                </p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{boundaries.filter(b => b.type === 'National').length}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Federal PCs</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{boundaries.filter(b => b.type === 'Local').length}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Municipal Wards</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Official Party Registry */}
            <div style={S.card}>
              <h2 style={S.section}>🛡️ Register New National / State Party</h2>
              {parties.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Registered on-chain:</p>
                  {parties.map(p => (
                    <span key={p.id} style={S.partyPill}>
                      <img src={p.logoUrl} alt="" style={S.partyLogo} onError={e => e.target.style.display = 'none'} />
                      #{p.id} {p.name}
                    </span>
                  ))}
                </div>
              )}

              <form onSubmit={doRegisterParty}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Party Name</label>
                    <input type="text" value={pName} onChange={e => setPName(e.target.value)} placeholder="e.g. Bhartiya Janta Party" style={S.input} required />
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Party Color Theme</label>
                    <input type="color" value={pColor} onChange={e => setPColor(e.target.value)} style={{...S.input, height: '48px', padding: '0.2rem', cursor: 'pointer'}} />
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Party Logo (PNG / Image)</label>
                    <input
                      id="party-logo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setPLogoFile(file);
                        doUploadLogo(file);
                      }}
                    />
                    <label
                      htmlFor="party-logo-upload"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.65rem 1rem', border: '2px dashed #94a3b8',
                        borderRadius: '6px', cursor: 'pointer', background: '#f8fafc',
                        fontSize: '0.875rem', color: '#334155', boxSizing: 'border-box',
                        transition: 'border-color .2s',
                        height: '48px',
                      }}
                    >
                      {pLogoFile ? (
                        <img src={URL.createObjectURL(pLogoFile)} alt="preview" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                      )}
                      <span style={{ flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{logoUploading ? '⏳ Uploading…' : pLogoFile ? pLogoFile.name : 'Upload logo'}</span>
                      {pLogo && !logoUploading && <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '1rem' }}>✓</span>}
                    </label>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={S.btn}>
                  {loading ? 'Processing…' : 'Register Party On-Chain'}
                </button>
              </form>
            </div>

            {/* Section 4: Post-Election Party Switch Defection Protocol */}
            <div style={{ ...S.card, borderColor: '#f59e0b', borderTopWidth: '4px' }}>
              <h2 style={{ ...S.section, color: '#b45309' }}>🔄 Post-Election Party Switch / Defection Protocol</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Only executable after the election is officially closed. The original party is preserved in the audit trail.
              </p>
              <form onSubmit={doSwitchParty}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Constituency ID</label>
                    <input type="number" value={swConstId} onChange={e => setSwConstId(e.target.value)} style={S.input} required />
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Candidate ID</label>
                    <input type="number" value={swCandId} onChange={e => setSwCandId(e.target.value)} style={S.input} required />
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.label}>New Party</label>
                    <select value={swNewParty} onChange={e => setSwNewParty(e.target.value)} style={S.select} required>
                      <option value="">— Select —</option>
                      {parties.map(p => <option key={p.id} value={p.id}>#{p.id} – {p.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ ...S.btn, backgroundColor: '#b45309' }}>
                  {loading ? 'Processing…' : 'Execute Party Switch On-Chain'}
                </button>
              </form>
            </div>

            {/* Section 5: Sealing & Publish Regional Audits */}
            <div style={{ ...S.card, borderColor: '#ef4444', borderTopWidth: '4px' }}>
              <h2 style={{ ...S.section, color: '#b91c1c' }}>⚠️ Publish Constituency Results</h2>
              <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.8rem', color: '#991b1b', lineHeight: 1.5 }}>
                <strong>VVPAT Random Audit:</strong> As per Supreme Court directives, VVPAT slips from 5 randomly selected polling stations per assembly segment must be physically verified against EVM electronic counts before sealing the final result.
                <br /><br />
                Publishing a constituency permanently seals it on-chain.
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>Select State</label>
                <select value={pubState} onChange={e => { setPubState(e.target.value); setPubConstId(''); }} style={S.select}>
                  <option value="">-- All States --</option>
                  {[...new Set(boundaries.filter(b => b.type === 'National' && b.state).map(b => b.state))].sort().map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>Select Constituency / Ward</label>
                <select id="pub-constituency-select" value={pubConstId} onChange={e => setPubConstId(e.target.value)} style={S.select}>
                  <option value="">-- Select Dynamically Seeded PC --</option>
                  <option value="ALL">🌟 PUBLISH ALL {pubState ? `IN ${pubState.toUpperCase()}` : '543 CONSTITUENCIES'} 🌟</option>
                  {boundaries
                    .filter(b => b.type === 'National' && (pubState === '' || b.state === pubState))
                    .map(c => (
                      <option key={c.geoId} value={c.geoId}>#{c.geoId} — {c.name}</option>
                  ))}
                </select>
              </div>
              <button id="pub-publish-btn" onClick={doPublishResults} disabled={loading || !pubConstId} style={{ ...S.btn, ...S.btnDanger }}>
                {pubConstId === 'ALL' ? '🚨 SEAL AND PUBLISH BULK RESULTS 🚨' : '🔏 Publish On-Chain Results for Selected Constituency'}
              </button>
            </div>
          </>
        )}

        {/* ── DEPT B: RETURNING OFFICER VIEW ────────────────── */}
        {((user?.role === 'ReturningOfficer') || (user?.role === 'Tester' && activeTab === 'ReturningOfficer')) && (
          <div style={S.card}>
            <h2 style={S.section}>🗳️ File Candidate Nomination (Section 33, RPA 1951)</h2>
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.78rem', color: '#166534', lineHeight: 1.5 }}>
              The Returning Officer accepts nomination papers from candidates. Each nomination is scrutinized for eligibility under the Representation of the People Act, 1951.
              Security deposit: ₹25,000 (Lok Sabha) / ₹10,000 (Vidhan Sabha). Forfeited if candidate secures &lt; 1/6th of total valid votes.
            </div>
            <form onSubmit={doAddCandidate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={S.inputGroup}>
                  <label style={S.label}>Constituency
                    {user?.role === 'ReturningOfficer' && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Zone-Locked</span>
                    )}
                  </label>
                  {user?.role !== 'ReturningOfficer' && (
                    <input
                      type="text"
                      placeholder="Search by state or constituency..."
                      value={constSearch}
                      onChange={e => setConstSearch(e.target.value)}
                      style={{ ...S.input, marginBottom: '0.4rem', fontSize: '0.875rem', padding: '0.5rem 0.8rem' }}
                    />
                  )}
                  <select 
                    name="constituency" 
                    value={cConstId}
                    onChange={(e) => setCConstId(e.target.value)}
                    style={{ ...S.select, height: user?.role === 'ReturningOfficer' ? 'auto' : '160px' }}
                    required
                    disabled={user?.role === 'ReturningOfficer'}
                  >
                    <option value="">-- Select State → Constituency --</option>
                    {user?.role === 'ReturningOfficer'
                      ? (() => {
                          // RO sees ONLY their zone
                          const zoneConst = boundaries.find(b => b.type === 'National' && b.geoId === Number(cConstId));
                          return zoneConst ? (
                            <option value={zoneConst.geoId}>{zoneConst.state} → {zoneConst.name}</option>
                          ) : (
                            <option value={cConstId}>Zone #{cConstId}</option>
                          );
                        })()
                      : (() => {
                          // Group by state using optgroup
                          const filtered = boundaries.filter(b =>
                            b.type === 'National' &&
                            (constSearch === '' ||
                              b.name.toLowerCase().includes(constSearch.toLowerCase()) ||
                              (b.state || '').toLowerCase().includes(constSearch.toLowerCase())
                            )
                          );
                          const byState = filtered.reduce((acc, c) => {
                            const st = c.state || 'Unknown';
                            if (!acc[st]) acc[st] = [];
                            acc[st].push(c);
                            return acc;
                          }, {});
                          return Object.keys(byState).sort().map(state => (
                            <optgroup key={state} label={`📍 ${state}`}>
                              {byState[state].map(c => (
                                <option key={c.geoId} value={c.geoId}>
                                  {c.name.replace(`${state} `, '').replace(' (PC)', '')} — #{c.geoId}
                                </option>
                              ))}
                            </optgroup>
                          ));
                        })()
                    }
                  </select>
                  {cConstId && !loading && (
                    <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.3rem' }}>
                      ✓ Selected: {boundaries.find(b => b.geoId === Number(cConstId))?.name || `ID #${cConstId}`}
                    </p>
                  )}
                </div>
                <div style={S.inputGroup}>
                  <label style={S.label}>Candidate Full Name</label>
                  <input type="text" value={cName} onChange={e => setCName(e.target.value)} style={S.input} required />
                </div>
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>Select Political Party</label>
                <select value={cPartyId} onChange={e => setCPartyId(e.target.value)} style={S.select} required>
                  <option value="">— Select a registered party —</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>#{p.id} – {p.name}</option>
                  ))}
                </select>
                {parties.length === 0 && <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.4rem' }}>⚠ No parties registered yet. Central HQ needs to create them first.</p>}
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>Number of Proposers (S. 33 RPA 1951)</label>
                <input type="number" value={cProposerCount} onChange={e => setCProposerCount(e.target.value)} style={S.input} placeholder="1 for Party, 10 for Independent" min="0" required />
              </div>
              <button type="submit" disabled={loading} style={S.btn}>
                {loading ? 'Processing…' : 'File Nomination to On-Chain Ledger'}
              </button>
            </form>

            {cConstId && (
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem' }}>📋 Filed Nominations & Scrutiny</h3>
                {cCandidates.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No candidates filed for this constituency yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {cCandidates.map(cand => (
                      <div key={cand.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <div>
                          <strong style={{ display: 'block', color: cand.isWithdrawn ? '#94a3b8' : '#0f172a', textDecoration: cand.isWithdrawn ? 'line-through' : 'none' }}>
                            {cand.name}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Party: {cand.partySymbol}</span>
                        </div>
                        {cand.isWithdrawn ? (
                          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, padding: '0.2rem 0.5rem', background: '#fee2e2', borderRadius: '4px' }}>WITHDRAWN</span>
                        ) : (
                          <button onClick={() => doWithdrawCandidate(cand.id)} disabled={loading} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                            Withdraw / Reject
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── DEPT C: ELECTORAL REGISTRATION VIEW ───────────── */}
        {((user?.role === 'ElectoralOfficer') || (user?.role === 'Tester' && activeTab === 'ElectoralOfficer')) && (
          <div style={{ ...S.card, borderLeft: '4px solid #000080' }}>
            <h2 style={S.section}>🪪 Voter Registry — Onboard to Constituency & Ward</h2>
            {voterCount !== null && (
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Registry total: <strong style={{ color: '#000080' }}>{voterCount}</strong> voters enrolled
              </p>
            )}
            <form onSubmit={doOnboardVoter}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ ...S.inputGroup, gridColumn: '1 / -1' }}>
                  <label style={S.label}>12-Digit Voter National ID Card (EPIC Token)</label>
                  <input
                    type="text"
                    value={vVoterId}
                    onChange={e => setVVoterId(e.target.value)}
                    maxLength={12}
                    placeholder="Enter legal card number string"
                    style={{ ...S.input, letterSpacing: '0.12em', fontFamily: 'monospace', fontSize: '1.05rem' }}
                    required
                  />
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                    The raw ID is never stored. A secure SHA-256 fingerprint signature is computed and uploaded onto the nodes instead.
                  </p>
                </div>
                <div style={S.inputGroup}>
                  <label style={S.label}>Constituency
                    <span style={{ fontWeight: 400, color: '#64748b', marginLeft: '0.4rem' }}>({electionSubtype})</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search by state or constituency..."
                    value={constSearch}
                    onChange={e => setConstSearch(e.target.value)}
                    style={{ ...S.input, marginBottom: '0.4rem', fontSize: '0.875rem', padding: '0.5rem 0.8rem' }}
                  />
                  <select value={vConstId} onChange={e => { setVConstId(e.target.value); setVWardId(''); }} style={{ ...S.select, height: '160px' }} required>
                    <option value="">-- Select State → Constituency --</option>
                    {(() => {
                      const filtered = boundaries.filter(b =>
                        b.type === 'National' &&
                        (constSearch === '' ||
                          b.name.toLowerCase().includes(constSearch.toLowerCase()) ||
                          (b.state || '').toLowerCase().includes(constSearch.toLowerCase())
                        )
                      );
                      const byState = filtered.reduce((acc, c) => {
                        const st = c.state || 'Unknown';
                        if (!acc[st]) acc[st] = [];
                        acc[st].push(c);
                        return acc;
                      }, {});
                      return Object.keys(byState).sort().map(state => (
                        <optgroup key={state} label={`📍 ${state}`}>
                          {byState[state].map(c => (
                            <option key={c.geoId} value={c.geoId}>
                              {c.name.replace(`${state} `, '').replace(' (PC)', '')} — #{c.geoId}
                            </option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                  </select>
                  {vConstId && (
                    <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.3rem' }}>
                      ✓ {boundaries.find(b => b.geoId === Number(vConstId))?.state} → {boundaries.find(b => b.geoId === Number(vConstId))?.name}
                    </p>
                  )}
                </div>
                <div style={S.inputGroup}>
                  <label style={S.label}>Ward / Local Body
                    {electionType === '0' && <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '0.4rem' }}>(Vidhan Sabha seats)</span>}
                  </label>
                  <select 
                    name="assignedWard" 
                    value={vWardId}
                    onChange={(e) => setVWardId(e.target.value)}
                    style={S.select}
                  >
                    <option value="">-- Select Ward --</option>
                    {vConstId && boundaries
                      .filter(b => b.type === 'Local' && b.parentConstituencyId === Number(vConstId))
                      .map(w => (
                        <option key={w.geoId} value={w.geoId}>
                          {w.name} [Zone Code: {w.geoId}]
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div style={{ ...S.inputGroup, display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" disabled={loading} style={{ ...S.btn, height: '42px', marginTop: 'auto' }}>
                    {loading ? 'Registering…' : 'Encrypt & Link to Ward'}
                  </button>
                </div>
              </div>
            </form>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px dashed #cbd5e1' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.5rem' }}>⚡ Electoral Roll Mass Synchronization</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                In reality, EROs (Electoral Registration Officers) prepare and upload electoral rolls in bulk. 
                Use this tool to simulate syncing thousands of pre-verified voters into the selected constituency/ward above.
              </p>
              <form onSubmit={doBulkOnboard} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ ...S.inputGroup, margin: 0 }}>
                  <label style={S.label}>Voters to Sync</label>
                  <select value={vBulkCount} onChange={e => setVBulkCount(Number(e.target.value))} style={{ ...S.select, width: '200px' }}>
                    <option value={100}>100 Voters</option>
                    <option value={1000}>1,000 Voters</option>
                    <option value={5000}>5,000 Voters</option>
                    <option value={10000}>10,000 Voters</option>
                  </select>
                </div>
                <button type="submit" disabled={bulkLoading || !vConstId || !vWardId} style={{ ...S.btn, margin: 0, backgroundColor: '#0f766e', width: 'auto', padding: '0.6rem 1.5rem' }}>
                  {bulkLoading ? 'Syncing...' : 'Simulate Bulk Roll Sync'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── DEPT D: PRESIDING OFFICER DISPUTE DESK ────────── */}
        {((user?.role === 'PresidingOfficer') || (user?.role === 'Tester' && activeTab === 'PresidingOfficer')) && (
          <>
            <div style={S.card}>
              <h2 style={S.section}>⚖️ Dispute Resolution — Challenge Ballot</h2>
              <form onSubmit={doChallenge}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Constituency ID</label>
                    <input type="number" value={chConstId} onChange={e => setChConstId(e.target.value)} style={S.input} required />
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Disputed Voter ID</label>
                    <input type="text" value={chVoterId} onChange={e => setChVoterId(e.target.value)} style={S.input} required />
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Candidate ID</label>
                    <input type="number" value={chCandId} onChange={e => setChCandId(e.target.value)} style={S.input} required />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ ...S.btn, ...S.btnOrange }}>
                  {loading ? 'Processing…' : 'Mint Challenge Ballot'}
                </button>
              </form>
            </div>

            <div style={{ ...S.card, marginTop: '2rem' }}>
              <h2 style={S.section}>⚖️ Rule 49P Dispute Console: Authorize Tendered Paper Ballot</h2>
              <form onSubmit={doTenderedBallot}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Constituency ID</label>
                    <input type="number" value={tdConstId} onChange={e => setTdConstId(e.target.value)} style={S.input} required />
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Voter Disputed ID Token</label>
                    <input type="text" value={tdVoterId} onChange={e => setTdVoterId(e.target.value)} style={S.input} required />
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.label}>Candidate Selected</label>
                    <input type="number" value={tdCandId} onChange={e => setTdCandId(e.target.value)} style={S.input} required />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ ...S.btn, backgroundColor: '#7c3aed' }}>
                  {loading ? 'Processing…' : 'Authorize & Log Tendered Ballot On-Chain'}
                </button>
              </form>
            </div>
          </>
        )}

      </main>
    </div>
  );
}