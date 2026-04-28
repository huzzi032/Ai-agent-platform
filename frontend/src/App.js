import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Public marketing pages
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/FeaturesPage';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// App pages
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import CreateAgent from './pages/CreateAgent';
import Documents from './pages/Documents';
import Training from './pages/Training';
import Integration from './pages/Integration';
import Conversations from './pages/Conversations';
import Settings from './pages/Settings';
import TestAgent from './pages/TestAgent';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public marketing routes ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<FeaturesPage />} />

        {/* ── Auth routes ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Protected app routes ── */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/create" element={<CreateAgent />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/agents/:id/documents" element={<Documents />} />
            <Route path="/agents/:id/training" element={<Training />} />
            <Route path="/agents/:id/test" element={<TestAgent />} />
            <Route path="/agents/:id/integration" element={<Integration />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
