import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/layout/Shell';
import RoleGuard from './components/layout/RoleGuard';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import DevTokens from './pages/DevTokens';

// Real pages (Phase 3)
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Gaps from './pages/Gaps';
import Remediation from './pages/Remediation';

import Export from './pages/Export';
import Connections from './pages/Connections';
import Tasks from './pages/Tasks';
import Policies from './pages/Policies';

// Placeholder pages (future phases)
import AuditorPortal from './pages/AuditorPortal';

import { PolicyProvider } from './lib/PolicyContext.jsx';

function App() {
  return (
    <PolicyProvider>
      <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/dev-tokens" element={<DevTokens />} />
        <Route path="/audit/:token" element={<AuditorPortal />} />
        
        {/* Root always goes to login first */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Authenticated Routes */}
        <Route element={<RoleGuard allowedRoles={['compliance_officer', 'engineer']} />}>
          <Route element={<Shell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/events" element={<Events />} />
            <Route path="/gaps" element={<Gaps />} />
            <Route path="/remediation" element={<Remediation />} />
            <Route path="/export" element={<Export />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/tasks" element={<Tasks />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </PolicyProvider>
  );
}

export default App;
