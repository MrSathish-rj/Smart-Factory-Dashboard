import React from 'react';

export default function About() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">About</h1>
      <div className="bg-factory-panel border border-slate-700 rounded-xl p-5 space-y-3 text-sm text-slate-300">
        <p>
          <strong>Smart Factory Monitoring System</strong> is an IoT-based dashboard
          that continuously tracks environmental conditions, machine health, and
          electrical parameters using an ESP32-S3 controller.
        </p>
        <p>
          Sensor data is published over MQTT to HiveMQ Cloud and streamed live into
          this dashboard, while historical data and alerts are persisted in Firebase.
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li>Controller: ESP32-S3</li>
          <li>Sensors: DHT11, BMP280, MQ135, SW-420 vibration</li>
          <li>Broker: HiveMQ Cloud (MQTT / WebSockets)</li>
          <li>Backend: Firebase Authentication + Realtime Database</li>
          <li>Frontend: React, Recharts, Tailwind CSS</li>
        </ul>
      </div>
    </div>
  );
}
