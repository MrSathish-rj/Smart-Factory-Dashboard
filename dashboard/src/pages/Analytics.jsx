import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useSensorData } from '../context/SensorDataContext.jsx';

function average(arr, key) {
  if (!arr.length) return 0;
  const sum = arr.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
  return (sum / arr.length).toFixed(2);
}

export default function Analytics() {
  const { history } = useSensorData();

  const stats = useMemo(
    () => ({
      avgTemp: average(history, 'temperature'),
      avgHumidity: average(history, 'humidity'),
      avgGas: average(history, 'gas'),
      avgPressure: average(history, 'pressure'),
      avgAltitude: average(history, 'altitude')
    }),
    [history]
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          ['Avg Temperature', stats.avgTemp, '°C'],
          ['Avg Humidity', stats.avgHumidity, '%'],
          ['Avg Gas', stats.avgGas, 'raw'],
          ['Avg Pressure', stats.avgPressure, 'hPa'],
          ['Avg Altitude', stats.avgAltitude, 'm']
        ].map(([label, value, unit]) => (
          <div key={label} className="bg-factory-panel rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">{label}</p>
            <p className="text-xl font-semibold">
              {value} <span className="text-sm text-slate-400">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="bg-factory-panel rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm text-slate-400 mb-3">Pressure vs Altitude (session)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={30} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
            <Legend />
            <Area type="monotone" dataKey="pressure" stroke="#60a5fa" fill="#60a5fa33" name="Pressure (hPa)" />
            <Area type="monotone" dataKey="altitude" stroke="#c084fc" fill="#c084fc33" name="Altitude (m)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
