import React from 'react';

const getColorForParty = (c) => {
  if (c && c.colorHex) return c.colorHex;
  const partyName = c && c.partySymbol ? c.partySymbol : '';
  const p = partyName.toLowerCase();
  if (p.includes('lotus') || p.includes('bjp')) return '#ea580c';
  if (p.includes('hand') || p.includes('congress') || p.includes('inc')) return '#2563eb';
  if (p.includes('broom') || p.includes('aap')) return '#16a34a';
  if (p.includes('sp') || p.includes('samajwadi')) return '#dc2626';
  if (p.includes('bsp') || p.includes('bahujan')) return '#7c3aed';
  if (p.includes('ncp')) return '#0891b2';
  return '#94a3b8';
};

const fmt = (n) => n?.toLocaleString('en-IN') || '0';

export default function ResultsDashboard({ candidates, resetVoterSession, eligibleVoters, isPublished, tenderedCount = 0 }) {
  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const turnout = eligibleVoters > 0 ? ((totalVotes / eligibleVoters) * 100).toFixed(2) : 0;
  const winner = candidates.length > 0 ? candidates.reduce((a, b) => a.voteCount > b.voteCount ? a : b) : null;

  // ── Locked / Counting-in-Progress State ──────────────────────────────────
  if (!isPublished) {
    return (
      <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '2rem', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f1f5f9', margin: '0 0 1.25rem 0' }}>
            Official Election Results
          </h2>
        </div>

        {/* Locked banner */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#f59e0b',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0.35rem 1rem',
            borderRadius: '99px',
            marginBottom: '1.25rem',
          }}>
            Official Status
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fcd34d', margin: '0 0 0.75rem' }}>
            Counting in Progress
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
            Awaiting Core ECI Sign-off for this constituency.<br />
            Results will be unsealed and published here once the<br />
            Returning Officer submits the official declaration on-chain.
          </p>
        </div>

        {/* Candidate name-only list — vote counts obscured */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {candidates.map(c => {
            const color = getColorForParty(c);
            return (
              <div key={c.id} style={{
                backgroundColor: '#1e293b',
                borderRadius: '10px',
                padding: '1.25rem 1.5rem',
                borderLeft: `6px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                filter: 'saturate(0.4)',
              }}>
                <img
                  src={c.logoUrl}
                  alt={c.partySymbol}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#334155', border: `2px solid ${color}`, flexShrink: 0 }}
                  onError={e => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Blank_flag.svg/1200px-Blank_flag.svg.png'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.partySymbol}</div>
                </div>
                {/* Redacted vote count */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#334155', background: '#334155', borderRadius: '4px', padding: '0.1rem 0.5rem', letterSpacing: '0.05em', userSelect: 'none' }}>
                    ████
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.1rem' }}>VOTES</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={resetVoterSession}
            style={{ padding: '0.75rem 2rem', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#334155'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#1e293b'}
          >
            View Another Constituency
          </button>
        </div>
      </div>
    );
  }

  // ── Published — Full Analytics Layout ────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '2rem', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', width: '100%', boxSizing: 'border-box' }}>

      {/* ── Global Summary Header ────────────────────── */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f1f5f9', margin: '0 0 1.25rem 0' }}>
          Official Election Results Declaration
        </h2>

        {/* Metric pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
          {[
            { label: 'Total Ballots Cast', value: fmt(totalVotes), color: '#38bdf8' },
            { label: 'Voter Turnout', value: `${turnout}%`, color: Number(turnout) >= 50 ? '#22c55e' : '#f59e0b' },
            { label: 'Eligible Voters', value: fmt(eligibleVoters), color: '#a78bfa' },
            { label: 'Candidates', value: candidates.length, color: '#fb923c' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem 1.25rem', minWidth: '140px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── Rule 49P Compliance Tracking Card ──────── */}
        <div style={{ marginTop: '1.5rem', backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', letterSpacing: '0.05em' }}>⚖️ Judicial Evaluation Ledger</h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Total Tendered Ballots Registered For Post-Poll Judicial Evaluation</p>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fcd34d', backgroundColor: '#1e293b', padding: '0.2rem 1rem', borderRadius: '6px', border: '1px solid #475569' }}>
            {fmt(tenderedCount)}
          </div>
        </div>

        {/* Winner banner */}
        {winner && winner.voteCount > 0 && (
          <div style={{ marginTop: '1.25rem', backgroundColor: '#14532d', border: '1px solid #16a34a', borderRadius: '8px', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏆</span>
            <span style={{ fontWeight: 700, color: '#bbf7d0' }}>Leading: {winner.name} — {fmt(winner.voteCount)} votes</span>
          </div>
        )}
      </div>

      {/* ── Candidate Cards Grid ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {candidates.map(c => {
          const voteShare = totalVotes === 0 ? 0 : ((c.voteCount / totalVotes) * 100).toFixed(1);
          const popShare  = eligibleVoters === 0 ? 0 : ((c.voteCount / eligibleVoters) * 100).toFixed(3);
          const color     = getColorForParty(c);
          const isWinner  = winner && c.id === winner.id && c.voteCount > 0;
          const defected  = c.switched;

          return (
            <div key={c.id} style={{
              backgroundColor: '#1e293b',
              borderRadius: '10px',
              padding: '1.5rem',
              borderLeft: `6px solid ${color}`,
              boxShadow: isWinner ? `0 0 0 2px ${color}40, 0 8px 24px rgba(0,0,0,0.3)` : '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative',
              transition: 'transform 0.2s',
            }}>

              {/* Winner crown */}
              {isWinner && (
                <div style={{ position: 'absolute', top: '-10px', right: '12px', backgroundColor: color, color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  🏆 Leading
                </div>
              )}

              {/* Defection badge */}
              {defected && (
                <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #b91c1c', borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🔄 <span>Defected / Switched Party Post-Election</span>
                  <span style={{ marginLeft: 'auto', backgroundColor: '#991b1b', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>⚠️ Audit Flagged</span>
                </div>
              )}

              {/* Card Header: logo + name + vote count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={c.logoUrl}
                    alt={c.partySymbol}
                    style={{ width: '62px', height: '62px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#334155', border: `3px solid ${color}` }}
                    onError={e => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Blank_flag.svg/1200px-Blank_flag.svg.png'; }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.2rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</h3>
                  <p style={{ fontSize: '0.8rem', margin: 0, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {c.partySymbol}
                    {defected && <span style={{ color: '#f87171', marginLeft: '0.4rem' }}>(original)</span>}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{fmt(c.voteCount)}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>VOTES</div>
                </div>
              </div>

              {/* Progress bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* Relative share */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                    <span>Relative Vote Share</span><span>{voteShare}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${voteShare}%`, height: '100%', backgroundColor: color, transition: 'width 1.2s ease-out', borderRadius: '4px' }} />
                  </div>
                </div>
                {/* Absolute population share */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Absolute Population Share</span><span style={{ fontWeight: 600 }}>{popShare}%</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Footer ──────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #1e293b' }}>
        <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
          Results verified and sealed on the ECI Blockchain Ledger.
        </p>
        <button
          onClick={resetVoterSession}
          style={{ padding: '0.75rem 2rem', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#334155'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#1e293b'}
        >
          View Another Constituency
        </button>
      </div>

    </div>
  );
}
