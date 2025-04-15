import dotenv from "dotenv";
import { Server } from "socket.io";
import mqtt from "mqtt";
import http from "http";

// dotenv.config();

const MQTT_BROKER_URL = "mqtt://192.168.117.73:1883";
// Konfigurasi MQTT
const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on("connect", () => {
  console.log("✅ Connected to MQTT Broker");
  mqttClient.subscribe(["iot/waterlevel", "iot/alert"], (err) => {
    if (err) {
      console.error("❌ MQTT Subscription error:", err);
    }
  });
});

mqttClient.on("error", (err) => {
  console.error("❌ MQTT Connection error:", err);
});

// Inisialisasi HTTP Server untuk Socket.IO
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Sesuaikan dengan frontend yang akan terhubung
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("✅ Client connected to Socket.IO");

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// Saat ada pesan dari MQTT, kirim langsung ke semua client Socket.IO
mqttClient.on("message", (topic, message) => {
  try {
    const parsedMessage = JSON.parse(message.toString());
    if (!parsedMessage) {
      console.warn("⚠️ Received empty message from MQTT");
      return;
    }
    console.log(`📡 MQTT Data: ${topic} -`, parsedMessage);

    io.emit("water-level", parsedMessage); // Kirim ke semua client yang terhubung
  } catch (error) {
    console.error("❌ Error processing MQTT message:", error);
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Socket.IO Server running on http://localhost:${PORT}`);
});
