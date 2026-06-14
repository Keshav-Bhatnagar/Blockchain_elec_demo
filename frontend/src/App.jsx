import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VotingScreen from './components/VotingScreen.jsx';
import EciControlVault from './components/EciControlVault.jsx';
import ElectionArchive from './components/ElectionArchive.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-emerald-500/30">
        <Routes>
          <Route path="/" element={<VotingScreen />} />
          <Route path="/archive" element={<ElectionArchive />} />
          <Route path="/eci-department-control" element={<EciControlVault />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
