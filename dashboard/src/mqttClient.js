// MQTT over WebSockets (browsers cannot open raw TCP sockets).
// HiveMQ Cloud exposes a WSS endpoint on port 8884.
import mqtt from 'mqtt';

const MQTT_CONFIG = {
  host: '324b7194ebde43ca9b9349a91cc1c8a3.s1.eu.hivemq.cloud',
  port: 8884,
  protocol: 'wss',
  username: 'Sathish',
  password: 'Sathish@2005',
  clientId: `dashboard-${Math.random().toString(16).slice(2, 10)}`
};

let client = null;

export function connectMQTT(onMessage, onStatusChange) {
  const url = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}/mqtt`;

  client = mqtt.connect(url, {
    username: MQTT_CONFIG.username,
    password: MQTT_CONFIG.password,
    clientId: MQTT_CONFIG.clientId,
    reconnectPeriod: 3000
  });

  client.on('connect', () => {
    onStatusChange?.('connected');
    client.subscribe('factory/data');
    client.subscribe('factory/alert');
  });

  client.on('reconnect', () => onStatusChange?.('reconnecting'));
  client.on('close', () => onStatusChange?.('disconnected'));
  client.on('error', (err) => {
    console.error('MQTT error:', err);
    onStatusChange?.('error');
  });

  client.on('message', (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());
      onMessage?.(topic, data);
    } catch (e) {
      onMessage?.(topic, payload.toString());
    }
  });

  return client;
}

export function disconnectMQTT() {
  if (client) {
    client.end(true);
    client = null;
  }
}
