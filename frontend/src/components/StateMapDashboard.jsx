import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { geoMercator } from 'd3-geo';

const GEOJSON_URL = 'https://raw.githubusercontent.com/datameet/maps/master/parliamentary-constituencies/india_pc_2019_simplified.geojson';

const S = {
  card: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', marginBottom: '2rem' },
  mapGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginTop: '1.5rem' },
  constituencyBlock: {
    padding: '1rem',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.15s, box-shadow 0.15s',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  blockName: { fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' },
  blockWinner: { fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, textShadow: '0 1px 1px rgba(0,0,0,0.3)' }
};

export default function StateMapDashboard({ stateName, onBack, onSelectConstituency }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [geoObj, setGeoObj] = useState(null);

  useEffect(() => {
    const fetchResultsAndGeo = async () => {
      setLoading(true);
      try {
        const [res, geoRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/voting/state-results?state=${encodeURIComponent(stateName)}`),
          axios.get(GEOJSON_URL)
        ]);
        setResults(res.data);
        
        const stateFeatures = geoRes.data.features.filter(f => f.properties.st_name.toLowerCase() === stateName.toLowerCase());
        setGeoObj({ type: 'FeatureCollection', features: stateFeatures });
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResultsAndGeo();
  }, [stateName]);

  const totalSeats = results.length;
  const declaredSeats = results.filter(r => r.isPublished && r.winner).length;
  const partyWins = {};
  
  results.forEach(r => {
    if (r.isPublished && r.winner) {
      const p = r.winner.partySymbol || 'Independent';
      partyWins[p] = (partyWins[p] || 0) + 1;
    }
  });

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#000080', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
          ← Back to States
        </button>
        <h2 style={{ margin: 0, color: '#000080', fontSize: '1.5rem' }}>{stateName} Electoral Map</h2>
        <div />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading real-time map & results for {stateName}...</div>
      ) : error ? (
        <div style={{ color: '#ef4444', textAlign: 'center' }}>Error: {error}</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-around', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Total Seats</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{totalSeats}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Declared</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{declaredSeats}</div>
            </div>
            {Object.entries(partyWins).sort((a,b)=>b[1]-a[1]).slice(0, 3).map(([party, wins]) => (
              <div key={party} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>{party}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ea580c' }}>{wins}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: '1rem' }}>
            Interactive Map: Click any geographical constituency boundary to view detailed insights.
          </p>

          {geoObj && geoObj.features.length > 0 && (
            <div style={{ width: '100%', height: '500px', backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
              <ComposableMap projection={geoMercator().fitSize([800, 500], geoObj)} width={800} height={500} style={{ width: "100%", height: "100%" }}>
                <Geographies geography={geoObj}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const pcName = geo.properties.pc_name;
                      const resData = results.find(r => r.name === pcName);
                      
                      const bgColor = resData && resData.isPublished && resData.winner && resData.winner.colorHex 
                        ? resData.winner.colorHex 
                        : (resData && resData.isPublished && resData.winner ? '#475569' : '#cbd5e1');
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            if (resData) onSelectConstituency(resData.constituencyId, pcName);
                          }}
                          style={{
                            default: { fill: bgColor, outline: 'none', stroke: '#fff', strokeWidth: 1 },
                            hover: { fill: '#3b82f6', outline: 'none', cursor: resData ? 'pointer' : 'default' },
                            pressed: { fill: '#1d4ed8', outline: 'none' }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            </div>
          )}

          <h3 style={{ fontSize: '1.1rem', color: '#000080', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Tile Grid View</h3>
          <div style={S.mapGrid}>
            {results.map(r => {
              const bgColor = r.isPublished && r.winner && r.winner.colorHex ? r.winner.colorHex : 
                             (r.isPublished && r.winner ? '#475569' : '#cbd5e1');
              
              return (
                <div 
                  key={r.constituencyId} 
                  style={{ ...S.constituencyBlock, backgroundColor: bgColor }}
                  onClick={() => onSelectConstituency(r.constituencyId, r.name)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; }}
                >
                  <div style={S.blockName}>{r.name}</div>
                  {r.isPublished ? (
                    r.winner ? (
                      <div style={S.blockWinner}>{r.winner.partySymbol}</div>
                    ) : (
                      <div style={S.blockWinner}>Tied / No Data</div>
                    )
                  ) : (
                    <div style={S.blockWinner}>Pending</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
