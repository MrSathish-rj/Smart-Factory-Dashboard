import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useSensorData } from '../context/SensorDataContext.jsx';

function ChartPanel({ title, dataKey, color, unit }) {
  const { history } = useSensorData();

  return (
    <div className="bg-factory-panel rounded-xl p-4 border border-slate-700">
      <h3 className="text-sm text-slate-400 mb-3">
        {title} {unit && `(${unit})`}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={30} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function LiveMonitoring() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Live Monitoring</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartPanel title="Temperature" dataKey="temperature" color="#f87171" unit="°C" />
        <ChartPanel title="Humidity" dataKey="humidity" color="#38bdf8" unit="%" />
        <ChartPanel title="Gas Level" dataKey="gas" color="#facc15" unit="raw" />
        <ChartPanel title="Pressure" dataKey="pressure" color="#60a5fa" unit="hPa" />
        <ChartPanel title="Altitude" dataKey="altitude" color="#c084fc" unit="m" />
      </div>
    </div>
  );
}
