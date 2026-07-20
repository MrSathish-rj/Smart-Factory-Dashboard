/*
  Smart Factory Monitoring System - ESP32-S3 Firmware
  ----------------------------------------------------
  Sensors: DHT11 (temp/humidity), BMP280 (pressure/altitude, I2C),
           MQ135 (air quality / gas), SW-420 (vibration)
  Publishes: JSON payload to HiveMQ Cloud over MQTT (TLS), AND
             mirrors the same readings to Blynk Cloud (virtual pins)
             so both the custom React dashboard and the Blynk
             mobile/web dashboard stay in sync.
  Alarms: Active buzzer on abnormal conditions

  Required Libraries (Arduino Library Manager):
    - DHT sensor library (Adafruit)
    - Adafruit Unified Sensor
    - Adafruit BMP280 Library
    - PubSubClient (Nick O'Leary)
    - ArduinoJson (Benoit Blanchon)
    - WiFiClientSecure (bundled with ESP32 core)
    - Blynk (Blynk IoT, by Volodymyr Shymanskyy)

  IMPORTANT: The three BLYNK_* defines below must appear BEFORE
  #include <BlynkSimpleEsp32.h> — Blynk uses them at compile time.
*/

#define BLYNK_TEMPLATE_ID "TMPL3JduAxV8s"
#define BLYNK_TEMPLATE_NAME "smart factory dashboard"  // From Blynk.Console > Template
#define BLYNK_AUTH_TOKEN    "oOeWXFras-Z7RkReZEegYAj-PdD_iC0f" // Device-specific token from Blynk

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <BlynkSimpleEsp32.h>

// ---------------- USER CONFIG ----------------
const char* WIFI_SSID     = "Mr.sathish";
const char* WIFI_PASSWORD = "12345678";

const char* MQTT_HOST     = "324b7194ebde43ca9b9349a91cc1c8a3.s1.eu.hivemq.cloud";
const int   MQTT_PORT     = 8883;                          // TLS port
const char* MQTT_USER     = "Sathish";
const char* MQTT_PASS     = "Sathish@2005";
const char* MQTT_CLIENT_ID = "esp32-factory-device1";

const char* DEVICE_ID     = "device1";

// ---------------- BLYNK VIRTUAL PIN MAPPING ----------------
// Create matching Datastreams in Blynk.Console with these exact Virtual Pins.
#define VPIN_TEMPERATURE  V0
#define VPIN_HUMIDITY     V1
#define VPIN_GAS          V2
#define VPIN_VIBRATION    V5
#define VPIN_PRESSURE     V3   // BMP280, hPa
#define VPIN_ALTITUDE     V4   // BMP280, meters (estimated from sea-level pressure)
#define VPIN_STATUS       V6  // String datastream: "Running" / "Alert"
#define VPIN_BUZZER       V7   // Input widget (Switch) - lets the app force the buzzer

// ---------------- PIN CONFIG ----------------
#define DHT_PIN        4
#define DHT_TYPE       DHT11

#define MQ135_PIN      5   // Analog (MQ135 air quality / gas sensor)
#define VIBRATION_PIN  16  // Digital (SW-420 has onboard comparator)
#define BUZZER_PIN     17   // Digital output

// BMP280 is I2C - wire SDA/SCL to these pins (adjust if your board differs)
#define I2C_SDA_PIN    41
#define I2C_SCL_PIN    42

// ---------------- THRESHOLDS ----------------
const float TEMP_THRESHOLD_C    = 45.0;
const int   GAS_THRESHOLD       = 1000;    // raw ADC threshold - MQ135 baseline, recalibrate against your clean-air reading
const int   VIBRATION_ALARM     = 1;      // digital HIGH = vibration detected
const float PRESSURE_LOW_HPA    = 950.0;  // abnormal low pressure (storm / sensor fault)
const float PRESSURE_HIGH_HPA   = 1050.0; // abnormal high pressure

// BMP280 altitude calc needs a sea-level reference; adjust to your local
// day's actual sea-level pressure for accurate altitude, or leave as
// standard atmosphere if you only care about relative changes.
const float SEALEVEL_HPA = 1013.25;

// Publish interval
const unsigned long PUBLISH_INTERVAL_MS = 3000;
unsigned long lastPublish = 0;

// Tracks whether each alarm was already active last cycle, so alerts fire
// once on the rising edge instead of flooding every publish cycle.
bool prevTempAlarm = false;
bool prevGasAlarm = false;
bool prevVibAlarm = false;
bool prevPressureAlarm = false;

DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BMP280 bmp; // I2C
bool bmpAvailable = false;

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);
BlynkTimer blynkTimer;

// Manual buzzer override flag - set from the Blynk app (VPIN_BUZZER switch widget)
bool manualBuzzerOverride = false;

// Blynk app "Switch" widget on V8 lets a user force the buzzer on/off
// (e.g. to silence a false alarm, or test the buzzer remotely).
BLYNK_WRITE(VPIN_BUZZER) {
  manualBuzzerOverride = param.asInt() == 1;
  digitalWrite(BUZZER_PIN, manualBuzzerOverride ? HIGH : LOW);
}

void connectBlynk() {
  Blynk.config(BLYNK_AUTH_TOKEN);
  Blynk.connect(5000); // 5s connect timeout, non-blocking retries happen in loop()
}

// HiveMQ Cloud uses a public CA (Let's Encrypt / ISRG Root X1).
// For production, pin the actual CA cert. setInsecure() skips verification
// (fine for prototyping, NOT recommended for production).
void configureTLS() {
  espClient.setInsecure();
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Reserved for incoming command topics (e.g., factory/command/buzzer)
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.printf("MQTT message on %s: %s\n", topic, msg.c_str());
}

void connectMQTT() {
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);

  while (!mqttClient.connected()) {
    Serial.print("Connecting to HiveMQ...");
    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println("connected.");
      mqttClient.subscribe("factory/command/#");
    } else {
      Serial.printf("failed, rc=%d, retrying in 3s\n", mqttClient.state());
      delay(1000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(VIBRATION_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  analogReadResolution(12); // ESP32-S3 ADC 12-bit

  // Pull-down gives a floating/disconnected MQ135 analog input a defined
  // near-zero resting state instead of picking up noise. The sensor's low
  // output impedance still drives the pin normally when actually connected.
  pinMode(MQ135_PIN, INPUT_PULLDOWN);

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  if (bmp.begin(0x76) || bmp.begin(0x77)) {
    bmpAvailable = true;
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                     Adafruit_BMP280::SAMPLING_X2,
                     Adafruit_BMP280::SAMPLING_X16,
                     Adafruit_BMP280::FILTER_X16,
                     Adafruit_BMP280::STANDBY_MS_500);
    Serial.println("BMP280 initialized.");
  } else {
    Serial.println("BMP280 not found - check wiring/I2C address (0x76/0x77).");
  }

  dht.begin();
  connectWiFi();
  configureTLS();
  connectMQTT();
  connectBlynk();
}

void publishSensorData() {
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  int   gasRaw       = analogRead(MQ135_PIN);
  int   vibration     = digitalRead(VIBRATION_PIN);

  float pressure = 0;
  float altitude = 0;
  if (bmpAvailable) {
    pressure = bmp.readPressure() / 100.0F; // Pa -> hPa
    altitude = bmp.readAltitude(SEALEVEL_HPA);
  }

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT11 read failed, skipping this cycle.");
    return;
  }

  bool tempAlarm     = temperature > TEMP_THRESHOLD_C;
  bool gasAlarm      = gasRaw > GAS_THRESHOLD;
  bool vibAlarm      = vibration == VIBRATION_ALARM;
  bool pressureAlarm = bmpAvailable && (pressure < PRESSURE_LOW_HPA || pressure > PRESSURE_HIGH_HPA);
  bool anyAlarm      = tempAlarm || gasAlarm || vibAlarm || pressureAlarm;

  // Auto buzzer control, unless a user has manually forced it via the
  // Blynk app switch widget (VPIN_BUZZER) - manual control wins until
  // they flip the switch back.
  if (!manualBuzzerOverride) {
    digitalWrite(BUZZER_PIN, anyAlarm ? HIGH : LOW);
  }

  StaticJsonDocument<512> doc;
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["humidity"]    = round(humidity * 10) / 10.0;
  doc["gas"]         = gasRaw;
  doc["vibration"]   = vibration;
  doc["pressure"]    = round(pressure * 10) / 10.0;
  doc["altitude"]    = round(altitude * 10) / 10.0;
  doc["status"]      = anyAlarm ? "Alert" : "Running";
  doc["device"]      = DEVICE_ID;

  char buffer[512];
  size_t n = serializeJson(doc, buffer);
  mqttClient.publish("factory/data", buffer, n);

  // Publish to individual topics too
  mqttClient.publish("factory/temperature", String(temperature).c_str());
  mqttClient.publish("factory/humidity", String(humidity).c_str());
  mqttClient.publish("factory/gas", String(gasRaw).c_str());
  mqttClient.publish("factory/vibration", String(vibration).c_str());
  mqttClient.publish("factory/pressure", String(pressure).c_str());
  mqttClient.publish("factory/altitude", String(altitude).c_str());
  mqttClient.publish("factory/status", anyAlarm ? "Alert" : "Running");

  if (anyAlarm) {
    // Only publish a new alert if a condition is newly triggered this cycle
    // (rising edge) - not just still active from before.
    bool isNewAlarm = (tempAlarm && !prevTempAlarm) ||
                       (gasAlarm && !prevGasAlarm) ||
                       (vibAlarm && !prevVibAlarm) ||
                       (pressureAlarm && !prevPressureAlarm);

    if (isNewAlarm) {
      StaticJsonDocument<256> alertDoc;
      alertDoc["device"] = DEVICE_ID;
      if (tempAlarm && !prevTempAlarm)           alertDoc["reason"] = "High Temperature";
      else if (gasAlarm && !prevGasAlarm)         alertDoc["reason"] = "Gas Leakage Detected";
      else if (vibAlarm && !prevVibAlarm)         alertDoc["reason"] = "High Vibration";
      else if (pressureAlarm && !prevPressureAlarm) alertDoc["reason"] = "Pressure Out of Range";
      else alertDoc["reason"] = "Abnormal Condition";

      char alertBuffer[256];
      size_t an = serializeJson(alertDoc, alertBuffer);
      mqttClient.publish("factory/alert", alertBuffer, an);

      Blynk.logEvent("factory_alert", String(alertDoc["reason"].as<const char*>()));
    }
  }

  prevTempAlarm = tempAlarm;
  prevGasAlarm = gasAlarm;
  prevVibAlarm = vibAlarm;
  prevPressureAlarm = pressureAlarm;

  if (Blynk.connected()) {
    Blynk.virtualWrite(VPIN_TEMPERATURE, temperature);
    Blynk.virtualWrite(VPIN_HUMIDITY, humidity);
    Blynk.virtualWrite(VPIN_GAS, gasRaw);
    Blynk.virtualWrite(VPIN_VIBRATION, vibration);
    Blynk.virtualWrite(VPIN_PRESSURE, pressure);
    Blynk.virtualWrite(VPIN_ALTITUDE, altitude);
    Blynk.virtualWrite(VPIN_STATUS, anyAlarm ? "Alert" : "Running");
  }

  Serial.println(buffer);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  if (!Blynk.connected()) Blynk.connect();
  Blynk.run();

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = now;
    publishSensorData();
  }
}
