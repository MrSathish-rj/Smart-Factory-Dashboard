import React, { useState } from 'react';

export default function Settings() {
  const [thresholds, setThresholds] = useState({
    temperature: 45,
    gas: 600,
    pressureHigh: 1050,
    pressureLow: 950
  });

  const handleChange = (key, value) => {
    setThresholds((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-2">Settings</h1>
      <p className="text-slate-400 text-sm mb-6">
        These thresholds mirror the alarm logic on the ESP32 firmware. Update the
        matching constants in <code>smart_factory_esp32.ino</code> to apply changes
        on the device itself.
      </p>

      <div className="space-y-4 bg-factory-panel border border-slate-700 rounded-xl p-5">
        {[
          ['temperature', 'Temperature Threshold (°C)'],
          ['gas', 'Gas Level Threshold (raw ADC)'],
          ['pressureHigh', 'High Pressure Threshold (hPa)'],
          ['pressureLow', 'Low Pressure Threshold (hPa)']
        ].map(([key, label]) => (
          <div key={key}>
            <label className="block text-sm text-slate-400 mb-1">{label}</label>
            <input
              type="number"
              value={thresholds[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-factory-accent"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
