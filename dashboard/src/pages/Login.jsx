import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Factory } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-factory-bg">
      <div className="bg-factory-panel p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Factory className="w-10 h-10 text-factory-accent mb-2" />
          <h1 className="text-xl font-semibold">Smart Factory Dashboard</h1>
          <p className="text-slate-400 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-factory-accent"
              placeholder="admin@factory.com"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-factory-accent"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-factory-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded-lg bg-factory-accent text-slate-900 font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
