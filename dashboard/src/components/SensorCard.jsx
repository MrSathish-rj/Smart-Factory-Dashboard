import React from 'react';

export default function SensorCard({ label, value, unit, icon: Icon, alarm }) {
  return (
    <div
      className={`rounded-xl p-4 bg-factory-panel border ${
        alarm ? 'border-factory-danger' : 'border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{label}</span>
        {Icon && (
          <Icon
            className={`w-5 h-5 ${alarm ? 'text-factory-danger' : 'text-factory-accent'}`}
          />
        )}
      </div>
      <div className="text-2xl font-semibold">
        {value ?? '--'}
        {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}
