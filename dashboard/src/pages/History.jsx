import React from 'react';
import { useSensorData } from '../context/SensorDataContext.jsx';

export default function History() {
  const { history } = useSensorData();
  const rows = [...history].reverse();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">History</h1>
      <p className="text-slate-400 text-sm mb-4">
        Showing this session's readings. Full historical data is persisted to Firebase
        Realtime Database under <code>factory-data/&lt;device&gt;</code>.
      </p>

      <div className="overflow-x-auto bg-factory-panel rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700">
              <th className="p-3">Time</th>
              <th className="p-3">Temp (°C)</th>
              <th className="p-3">Humidity (%)</th>
              <th className="p-3">Gas</th>
              <th className="p-3">Vibration</th>
              <th className="p-3">Pressure (hPa)</th>
              <th className="p-3">Altitude (m)</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-b border-slate-800">
                <td className="p-3">{r.time}</td>
                <td className="p-3">{r.temperature}</td>
                <td className="p-3">{r.humidity}</td>
                <td className="p-3">{r.gas}</td>
                <td className="p-3">{r.vibration ? 'Yes' : 'No'}</td>
                <td className="p-3">{r.pressure}</td>
                <td className="p-3">{r.altitude}</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
