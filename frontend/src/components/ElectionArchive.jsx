import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/voting';

const fmt = (n) => (n || 0).toLocaleString('en-IN');

const PARTY_COLORS = {
  bjp: '#ea580c', lotus: '#ea580c',
  congress: '#2563eb', inc: '#2563eb', hand: '#2563eb',
  aap: '#16a34a', broom: '#16a34a',
  sp: '#dc2626', samajwadi: '#dc2626',
  bsp: '#7c3aed', bahujan: '#7c3aed',
  tmc: '#2563eb', trinamool: '#2563eb',
  default: '#64748b',
};

const partyColor = (name = '') => {
  const n = name.toLowerCase();
  for (const [key, color] of Object.entries(PARTY_COLORS)) {
    if (n.includes(key)) return color;
  }
  return PARTY_COLORS.default;
};

export default function ElectionArchive() {
  const [archives, setArchives] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stateFilter, setStateFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API}/archived-elections`)
      .then(r => { setArchives(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openArchive = async (id) => {
    setSelected(id);
    setDetailLoading(true);
    setStateFilter('');
    setSearch('');
    try {
      const r = await axios.get(`${API}/archived-elections/${id}`);
      setDetail(r.data);
    } catch(e) { setDetail(null); }
    setDetailLoading(false);
  };

  const allStates = detail
    ? [...new Set(detail.results.map(r => r.state).filter(Boolean))].sort()
    : [];

  const filteredResults = detail
    ? detail.results.filter(r => {
        const matchState = stateFilter ? r.state === stateFilter : true;
        const matchSearch = search
          ? r.constituencyName?.toLowerCase().includes(search.toLowerCase()) ||
            r.winnerName?.toLowerCase().includes(search.toLowerCase()) ||
            r.winnerParty?.toLowerCase().includes(search.toLowerCase())
          : true;
        return matchState && matchSearch;
      })
    : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, var(--eci-navy) 0%, #1e3a8a 100%)',
        borderTop: '6px solid var(--eci-saffron)',
        borderBottom: '6px solid var(--eci-green)',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 128, 0.4)',
      }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '120%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', opacity: 0.8, marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>
          Election Commission of India
        </div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900, margin: 0, letterSpacing: '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          📜 Chunav Parinaam Sangraha
        </h1>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', opacity: 0.85, fontWeight: 500 }}>
          Public Election Results Archive — Past Elections History
        </p>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Back button when viewing detail */}
        {detail && (
          <button
            onClick={() => { setDetail(null); setSelected(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'none', border: '2px solid #000080', borderRadius: '8px',
              color: '#000080', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              padding: '0.5rem 1.25rem', marginBottom: '1.5rem',
            }}
          >
            ← Wapas / Back to Elections List
          </button>
        )}

        {/* ── ARCHIVE LIST VIEW ── */}
        {!detail && (
          <>
            <h2 style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: 800, marginBottom: '0.5rem' }}>
              Pichhle Chunav / Past Elections
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              RPA 1951 ke anusar sabhi election results publicly available hain.
              <br />As per RPA 1951, all election results are public domain information.
            </p>

            {loading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                <div>Loading archives...</div>
              </div>
            )}

            {!loading && archives.length === 0 && (
              <div style={{
                background: '#fff', border: '2px dashed #cbd5e1', borderRadius: '16px',
                padding: '3rem 2rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ fontSize: '1.2rem', color: '#334155', fontWeight: 700, margin: '0 0 0.5rem' }}>
                  Abhi koi archive nahi hai
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  No elections have been archived yet. Results will appear here after an election term is completed and archived by ECI Admin.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {archives.map(a => (
                <div
                  key={a._id}
                  onClick={() => openArchive(a._id)}
                  className="hover-scale"
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderLeft: '6px solid var(--eci-navy)',
                    borderRadius: '16px',
                    padding: '1.5rem 2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                      🏛️ {a.electionName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500 }}>
                      {a.electionType} Election &nbsp;·&nbsp;
                      Archived: {new Date(a.archivedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--eci-navy)' }}>{a.totalSeats}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Seats</div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                      {fmt(a.totalValidVotes)} votes
                    </div>
                    <div className="btn-primary" style={{
                      display: 'inline-block', marginTop: '0.75rem',
                      borderRadius: '99px', padding: '0.4rem 1rem',
                      fontSize: '0.8rem', fontWeight: 700,
                    }}>
                      Dekhen / View →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── DETAIL VIEW ── */}
        {detailLoading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            Loading results...
          </div>
        )}

        {detail && !detailLoading && (
          <>
            {/* Summary Header */}
            <div style={{
              background: 'linear-gradient(135deg, #000080 0%, #1d4ed8 100%)',
              borderRadius: '16px', padding: '1.75rem 2rem', color: '#fff',
              marginBottom: '1.5rem',
            }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 0.25rem' }}>
                🏛️ {detail.electionName}
              </h2>
              <p style={{ opacity: 0.8, fontSize: '0.85rem', margin: '0 0 1rem' }}>
                {detail.electionType} Election &nbsp;·&nbsp;
                Archived on {new Date(detail.archivedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
              </p>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{detail.results.length}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.75, textTransform: 'uppercase' }}>Total Seats</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{fmt(detail.totalValidVotes)}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.75, textTransform: 'uppercase' }}>Total Valid Votes</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{allStates.length}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.75, textTransform: 'uppercase' }}>States / UTs</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                style={{
                  flex: 1, minWidth: '180px', padding: '0.75rem 1rem',
                  border: '2px solid #cbd5e1', borderRadius: '8px',
                  fontSize: '0.95rem', background: '#fff', cursor: 'pointer',
                }}
              >
                <option value="">🗺️ Sabhi Rajya / All States</option>
                {allStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                type="text"
                placeholder="🔍 Search constituency, winner, party..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 2, minWidth: '220px', padding: '0.75rem 1rem',
                  border: '2px solid #cbd5e1', borderRadius: '8px',
                  fontSize: '0.95rem', outline: 'none',
                }}
              />
            </div>

            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              {filteredResults.length} constituency results shown
            </div>

            {/* Results Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredResults.map(r => (
                <div key={r.constituencyId} style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderLeft: `5px solid ${partyColor(r.winnerParty)}`,
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}>
                  {/* Logo */}
                  {r.winnerLogo ? (
                    <img src={r.winnerLogo} alt={r.winnerParty}
                      style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} />
                  ) : (
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '8px', flexShrink: 0,
                      background: partyColor(r.winnerParty), display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '1.2rem',
                    }}>🏅</div>
                  )}

                  {/* Constituency + State */}
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      {r.constituencyName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                      {r.state} &nbsp;·&nbsp; PC #{r.constituencyId}
                    </div>
                  </div>

                  {/* Winner */}
                  <div style={{ flex: 2, minWidth: '160px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {r.isUncontested ? '🏆 Nirvirodh / Uncontested' : r.isTie ? '⚖️ Tie — Draw of Lots Needed' : '🏆 Jeeta / Winner'}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2, marginTop: '0.15rem' }}>
                      {r.winnerName || '—'}
                    </div>
                    <div style={{
                      display: 'inline-block', marginTop: '0.25rem',
                      background: partyColor(r.winnerParty) + '20',
                      color: partyColor(r.winnerParty),
                      borderRadius: '99px', padding: '0.15rem 0.6rem',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      {r.winnerParty || 'Independent'}
                    </div>
                  </div>

                  {/* Votes */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      {fmt(r.totalVotes)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Kul Votes
                    </div>
                  </div>
                </div>
              ))}

              {filteredResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Koi nateeja nahi mila / No results found.
                </div>
              )}
            </div>

            {/* Blockchain stamp */}
            <div style={{
              marginTop: '2rem', background: '#0f172a', borderRadius: '10px',
              padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.75rem',
              fontFamily: 'monospace', wordBreak: 'break-all',
            }}>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>🔗 On-Chain Contract Address: </span>
              {detail.contractAddress}
            </div>
          </>
        )}
      </main>

      <footer style={{
        textAlign: 'center', padding: '1.5rem',
        borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.78rem',
        background: '#fff', marginTop: '2rem',
      }}>
        Yeh data RPA 1951 ke Section 66 ke tahat publicly accessible hai. &nbsp;|&nbsp;
        Public domain under Section 66 of the Representation of the People Act, 1951.
      </footer>
    </div>
  );
}
