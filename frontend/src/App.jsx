import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import HostDashboard from './pages/HostDashboard';
import ParticipantView from './pages/ParticipantView';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-text">
        <ConnectionStatus />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/host/:roomCode" element={<HostDashboard />} />
          <Route path="/play/:roomCode" element={<ParticipantView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
