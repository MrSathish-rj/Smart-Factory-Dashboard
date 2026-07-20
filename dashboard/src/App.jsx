import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { SensorDataProvider } from './context/SensorDataContext.jsx';
import Sidebar from './components/Sidebar.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LiveMonitoring from './pages/LiveMonitoring.jsx';
import Analytics from './pages/Analytics.jsx';
import Alerts from './pages/Alerts.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import About from './pages/About.jsx';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-factory-bg text-slate-400">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <SensorDataProvider>
      <div className="flex min-h-screen bg-factory-bg">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </SensorDataProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/live"
        element={
          <ProtectedLayout>
            <LiveMonitoring />
          </ProtectedLayout>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedLayout>
            <Analytics />
          </ProtectedLayout>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedLayout>
            <Alerts />
          </ProtectedLayout>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedLayout>
            <History />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedLayout>
            <About />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
