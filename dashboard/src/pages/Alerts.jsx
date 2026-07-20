import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSensorData } from '../context/SensorDataContext.jsx';

export default function Alerts() {
  const { alerts } = useSensorData();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Alerts</h1>

      {alerts.length === 0 ? (
        <p className="text-slate-400">No alerts triggered yet. All systems normal.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-factory-panel border border-factory-danger/40 rounded-xl p-4"
            >
              <AlertTriangle className="w-5 h-5 text-factory-danger mt-0.5" />
              <div>
                <p className="font-medium text-factory-danger">{a.reason || 'Alert triggered'}</p>
                <p className="text-sm text-slate-400">
                  Device: {a.device || 'device1'} · {a.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
