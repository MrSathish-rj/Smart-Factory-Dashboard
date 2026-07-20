# Smart Factory Dashboard

Full source code for an IoT Smart Factory Monitoring System: ESP32-S3 firmware +
React/Firebase dashboard (MQTT over HiveMQ Cloud), plus a Blynk mobile/web
dashboard running in parallel off the same device.

Sensors: **DHT11** (temperature/humidity), **BMP280** (pressure/altitude, I2C),
**MQ135** (air quality/gas), **SW-420** (vibration), plus an active buzzer for
alarms.

```
smart-factory-dashboard/
├── firmware/
│   └── smart_factory_esp32.ino     # ESP32-S3 Arduino sketch
├── dashboard/                       # React + Vite + Tailwind app
│   ├── src/
│   │   ├── pages/                   # Login, Dashboard, Live, Analytics, Alerts, History, Settings, About
│   │   ├── components/              # Sidebar, SensorCard
│   │   ├── context/                 # AuthContext, SensorDataContext (MQTT + Firebase)
│   │   ├── firebase.js
│   │   ├── mqttClient.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── firebase-rules/
│   └── database.rules.json
└── README.md
```

## 1. Hardware Wiring

| Component          | ESP32-S3 Pin |
|---------------------|-------------|
| DHT11 data           | GPIO 4      |
| MQ135 analog out     | GPIO 34     |
| SW-420 digital out   | GPIO 27     |
| Buzzer +              | GPIO 25     |
| BMP280 SDA (I2C)      | GPIO 8      |
| BMP280 SCL (I2C)       | GPIO 9      |

BMP280 is I2C, not analog/digital like the others — SDA and SCL are shared
with any other I2C devices you might add later. BMP280 runs on **3.3V, not
5V** — check your breakout board's regulator before wiring; most breakout
boards (with onboard regulator) tolerate 5V, but bare modules do not.

All sensor grounds share the ESP32 GND. Adjust pins in the sketch
(`I2C_SDA_PIN`, `I2C_SCL_PIN`, etc.) if your board's pin layout differs from
the defaults above.

## 2. Firmware Setup (Arduino IDE)

1. Install **ESP32 board package** (Boards Manager → search "esp32").
2. Install libraries: `DHT sensor library`, `Adafruit Unified Sensor`,
   `Adafruit BMP280 Library` (installs `Adafruit BusIO` as a dependency),
   `PubSubClient`, `ArduinoJson`, `Blynk` (search "Blynk" by Volodymyr
   Shymanskyy — installs `BlynkSimpleEsp32.h`).
3. Open `firmware/smart_factory_esp32.ino`.
4. Fill in:
   - `WIFI_SSID`, `WIFI_PASSWORD`
   - `MQTT_HOST`, `MQTT_USER`, `MQTT_PASS` (from your HiveMQ Cloud cluster)
   - `BLYNK_TEMPLATE_ID`, `BLYNK_TEMPLATE_NAME`, `BLYNK_AUTH_TOKEN` (from Blynk,
     see section 5 below)
5. Adjust `GAS_THRESHOLD` after letting the MQ135 warm up and logging its
   clean-air baseline via Serial Monitor (see note in section 9).
6. Optionally adjust `SEALEVEL_HPA` to your local day's actual sea-level
   pressure for more accurate altitude readings (defaults to standard
   atmosphere, 1013.25 hPa).
7. Select board **ESP32S3 Dev Module**, select the correct COM port, and upload.
8. Open Serial Monitor (115200 baud) to confirm Wi-Fi + MQTT + Blynk connection,
   confirm `BMP280 initialized.` printed (not `BMP280 not found`), and see
   published JSON payloads.

## 3. HiveMQ Cloud Setup

1. Create a free cluster at HiveMQ Cloud.
2. Create MQTT credentials (username/password) — used by both the ESP32 and the
   dashboard.
3. Note your cluster URL, e.g. `xxxxxxxx.s1.eu.hivemq.cloud`.
   - Firmware connects over **TLS on port 8883**.
   - Browser dashboard connects over **WebSocket Secure (WSS) on port 8884**
     (browsers can't open raw MQTT/TCP sockets).

## 4. Firebase Setup

1. Create a Firebase project → enable **Authentication (Email/Password)** and
   **Realtime Database**.
2. Create a user (e.g. `admin@factory.com`) under Authentication → Users, or add
   a sign-up flow if you want self-service accounts.
3. Deploy the rules in `firebase-rules/database.rules.json` (Realtime Database →
   Rules tab).
4. Copy your Firebase web config into `dashboard/src/firebase.js`
   (`apiKey`, `authDomain`, `databaseURL`, `projectId`, etc. — found in
   Project Settings → General → Your apps).

## 5. Blynk Setup (Mobile App + Web Dashboard)

Blynk runs alongside HiveMQ/Firebase, not instead of it — the ESP32 publishes
the same readings to both every cycle.

### 5a. Create the Template

1. Sign in at Blynk.Console (or the Blynk mobile app → create account).
2. **Templates → New Template**. Name it `Smart Factory`, hardware = ESP32,
   connection = WiFi.
3. Copy the generated **Template ID** into `BLYNK_TEMPLATE_ID` in the firmware.

### 5b. Add Datastreams (must match the firmware's virtual pin mapping)

| Virtual Pin | Name          | Type   | Range / Notes                |
|-------------|---------------|--------|-------------------------------|
| V0          | Temperature    | Double | 0–100 °C                      |
| V1          | Humidity        | Double | 0–100 %                       |
| V2          | Gas Level        | Integer| 0–4095 (raw ADC)              |
| V3          | Vibration         | Integer| 0/1                            |
| V4          | Pressure           | Double | 300–1100 hPa                   |
| V5          | Altitude            | Double | -500–9000 m                    |
| V7          | Status                | String | "Running" / "Alert"           |
| V8          | Buzzer Override        | Integer| 0/1, **Input** (app → device) |

V0, V1, V2, V3, V4, V5, V7 are device-to-app (output); V8 is app-to-device
(input) — it's the switch widget that lets you force the buzzer from the
app, handled by `BLYNK_WRITE(VPIN_BUZZER)` in the firmware. (V6 is
intentionally unused, reserved from an earlier revision.)

### 5c. Add an Event (for push/email alerts)

**Events → New Event**, code `factory_alert`, enable notifications. The
firmware calls `Blynk.logEvent("factory_alert", reason)` on every new
threshold breach, matching the same alarm conditions used for
`factory/alert` over MQTT.

### 5d. Get the device Auth Token

**Devices → New Device → From Template → Smart Factory**. Copy the generated
**Auth Token** into `BLYNK_AUTH_TOKEN` in the firmware.

### 5e. Build the Mobile App Dashboard

In the Blynk app, open your device → **Web/Mobile Dashboard** editor → drag
in widgets and bind each to its Datastream:
- Gauge or Value Display → Temperature (V0), Humidity (V1)
- Level/Gauge → Gas Level (V2)
- LED widget → Vibration (V3)
- Gauge or Value Display → Pressure (V4), Altitude (V5)
- Labeled Value → Status (V7)
- Switch → Buzzer Override (V8)

### 5f. Build the Web Dashboard

Blynk.Console → your device → **Web Dashboard** tab uses the same widget
picker and the same Datastreams — build it the same way as 5e; layout is
independent per surface but the underlying data (and Auth Token) is shared.

## 6. Dashboard Setup (React)

```bash
cd dashboard
npm install
```

Fill in MQTT connection details in `src/mqttClient.js`
(`host`, `username`, `password` — same HiveMQ credentials as the firmware,
port 8884, protocol `wss`).

Run locally:

```bash
npm run dev
```

Visit `http://localhost:5173`, log in with the Firebase user you created, and
the dashboard will start receiving live data as soon as the ESP32 publishes.

Build for production:

```bash
npm run build
```

Deploy the `dist/` folder to Firebase Hosting, Vercel, or Netlify.

## 7. Data Flow Recap

```
                                  ┌─► MQTT (HiveMQ, TLS 8883)
                                  │      │
                                  │      ├─► React Dashboard (WSS 8884) — live view
                                  │      └─► (dashboard also writes latest reading +
                                  │           alerts into Firebase Realtime Database
                                  │           for persistence)
Sensors → ESP32-S3 ───────────────┤
                                  └─► Blynk Cloud (virtual pins V0-V5, V7)
                                         │
                                         ├─► Blynk mobile app dashboard
                                         └─► Blynk web dashboard
                                  (V8 flows the other way: app switch → device,
                                   BLYNK_WRITE overrides the buzzer)
```

Both paths run independently — if HiveMQ or Blynk is briefly unreachable, the
other keeps working since each has its own connection/retry loop in `loop()`.

## 8. MQTT Topics

- `factory/data` — full JSON payload (primary topic the dashboard subscribes to)
- `factory/temperature`, `factory/humidity`, `factory/gas`, `factory/vibration`,
  `factory/pressure`, `factory/altitude`, `factory/status` — individual
  scalar topics
- `factory/alert` — JSON alert payload, published only when a threshold is
  newly breached (edge-triggered — one alert per new incident, not repeated
  every publish cycle)

## 9. Alarm Thresholds

| Condition   | Threshold           |
|--------------|---------------------|
| Temperature   | > 45 °C             |
| Gas            | > 600 (raw ADC)     |
| Vibration       | Digital HIGH        |
| Pressure         | < 950 hPa or > 1050 hPa |

**On the MQ135 threshold specifically:** MQ135 needs a warm-up period (several
minutes) before readings stabilize, and its clean-air baseline varies by unit.
Log the raw ADC value in clean air via Serial Monitor after warm-up, then set
`GAS_THRESHOLD` meaningfully above that baseline for what you're actually
trying to detect.

**On the pressure threshold:** 950–1050 hPa is a reasonable range at sea
level for "normal atmospheric conditions, sensor probably not faulty" — it is
NOT meant to detect anything specific like weather events. If you're at
meaningful altitude, or want this alarm to mean something particular for your
use case, adjust `PRESSURE_LOW_HPA` / `PRESSURE_HIGH_HPA` accordingly, or
remove the pressure alarm entirely if you only care about tracking the value.

Any breach activates the buzzer, sets `status: "Alert"`, and publishes one new
`factory/alert` event (see section 8).

## Notes & Next Steps

- `WiFiClientSecure::setInsecure()` is used for TLS in the firmware for quick
  prototyping. For production, pin HiveMQ's actual CA certificate instead.
- The dashboard currently mirrors thresholds only for display in Settings; wire
  it up to Firebase Remote Config or a dedicated DB path if you want to push
  threshold changes back to the device (e.g. via an MQTT command topic —
  `factory/command/#` is already subscribed to on the firmware side as a hook).
- Add a Firestore/Realtime Database index on `timestamp` under `factory-data`
  if you extend History to paginate long-term data instead of just the current
  session buffer.
- Blynk's free tier caps Datastream update frequency and event/notification
  volume — if you hit rate limits, increase `PUBLISH_INTERVAL_MS` or only
  publish to Blynk when a value has changed meaningfully.
- If `bmp.begin(0x76)` fails ("BMP280 not found" in Serial Monitor), the
  firmware automatically tries `0x77` next — some breakout boards wire the
  address pin differently. If both fail, pressure/altitude report as `0`
  (not crash) so the rest of the system keeps working while you debug wiring.
