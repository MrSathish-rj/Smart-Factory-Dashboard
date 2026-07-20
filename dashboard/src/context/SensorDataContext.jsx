import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectMQTT, disconnectMQTT } from '../mqttClient.js';
import { ref, push, set } from 'firebase/database';
import { db } from '../firebase.js';

const SensorDataContext = createContext(null);
const MAX_HISTORY_POINTS = 50;

export function SensorDataProvider({ children }) {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [mqttStatus, setMqttStatus] = useState('disconnected');

  useEffect(() => {
    connectMQTT(
      (topic, data) => {
        if (topic === 'factory/data' && typeof data === 'object') {
          const point = { ...data, time: new Date().toLocaleTimeString() };
          setLatest(point);
          setHistory((prev) => {
            const next = [...prev, point];
            return next.length > MAX_HISTORY_POINTS
              ? next.slice(next.length - MAX_HISTORY_POINTS)
              : next;
          });

          // Persist to Firebase Realtime Database for historical analytics
          try {
            set(ref(db, `factory-data/${data.device || 'device1'}`), {
              ...data,
              timestamp: Date.now()
            });
          } catch (e) {
            console.warn('Firebase write skipped:', e.message);
          }
        }

        if (topic === 'factory/alert' && typeof data === 'object') {
          const alertEntry = { ...data, time: new Date().toLocaleString() };
          setAlerts((prev) => [alertEntry, ...prev].slice(0, 100));

          try {
            push(ref(db, 'alerts'), alertEntry);
          } catch (e) {
            console.warn('Firebase alert write skipped:', e.message);
          }
        }
      },
      (status) => setMqttStatus(status)
    );

    return () => disconnectMQTT();
  }, []);

  return (
    <SensorDataContext.Provider value={{ latest, history, alerts, mqttStatus }}>
      {children}
    </SensorDataContext.Provider>
  );
}

export function useSensorData() {
  return useContext(SensorDataContext);
}
