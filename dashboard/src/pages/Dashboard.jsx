import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Waves,
  Gauge,
  ArrowDownWideNarrow,
  Mountain
} from 'lucide-react';
import SensorCard from '../components/SensorCard.jsx';
import { useSensorData } from '../context/SensorDataContext.jsx';

export default function Dashboard() {
  const { latest, mqttStatus } = useSensorData();

  const tempAlarm = latest && latest.temperature > 45;
  const gasAlarm = latest && latest.gas > 600;
  const vibAlarm = latest && latest.vibration === 1;
 const pressureAlarm = latest && latest.pressure > 0 && (latest.pressure < 950 || latest.pressure > 1050);
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              mqttStatus === 'connected' ? 'bg-factory-ok' : 'bg-factory-danger'
            }`}
          />
          <span className="text-slate-400 capitalize">{mqttStatus}</span>
        </div>
      </div>

      <div className="mb-6">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            latest?.status === 'Alert'
              ? 'bg-factory-danger/20 text-factory-danger'
              : 'bg-factory-ok/20 text-factory-ok'
          }`}
        >
          Machine Status: {latest?.status ?? 'Waiting for data...'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SensorCard label="Temperature" value={latest?.temperature} unit="°C" icon={Thermometer} alarm={tempAlarm} />
        <SensorCard label="Humidity" value={latest?.humidity} unit="%" icon={Droplets} alarm={false} />
        <SensorCard label="Gas Level" value={latest?.gas} unit="ppm-raw" icon={Wind} alarm={gasAlarm} />
        <SensorCard label="Vibration" value={latest ? (latest.vibration ? 'Detected' : 'Normal') : null} icon={Waves} alarm={vibAlarm} />
        <SensorCard label="Pressure" value={latest?.pressure} unit="hPa" icon={ArrowDownWideNarrow} alarm={pressureAlarm} />
        <SensorCard label="Altitude" value={latest?.altitude} unit="m" icon={Mountain} alarm={false} />
        <SensorCard label="Device" value={latest?.device ?? 'device1'} icon={Gauge} alarm={false} />
      </div>
    </div>
  );
}
