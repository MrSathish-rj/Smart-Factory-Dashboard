import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Bell,
  History,
  Settings,
  Info,
  LogOut,
  Factory
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/live', label: 'Live Monitoring', icon: Activity },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/about', label: 'About', icon: Info }
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-factory-panel min-h-screen flex flex-col p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Factory className="w-7 h-7 text-factory-accent" />
        <span className="font-semibold text-lg">Factory IoT</span>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-factory-accent text-slate-900 font-medium'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-factory-danger hover:bg-slate-800"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </aside>
  );
}
