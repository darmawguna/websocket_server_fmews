import dotenv from "dotenv";
import WebSocket from "ws";
import mqtt from "mqtt";

dotenv.config();

// Konfigurasi MQTT
const mqttClient = mqtt.connect("mqtt://192.168.1.13:1883");

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

// Inisialisasi WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("✅ Client connected");

  ws.on("message", (message) => {
    console.log(`📩 Received: ${message}`);
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
  });
});

// Saat ada pesan dari MQTT, kirim langsung ke WebSocket
mqttClient.on("message", (topic, message) => {
  try {
    // console.log(message);
    const parsedMessage = message.toString();
    if (!parsedMessage) {
      console.warn("⚠️ Received empty message from MQTT");
      return;
    }
    console.log(`📡 MQTT Data: ${topic} - ${parsedMessage}`);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ topic, data: parsedMessage }));
      }
    });
  } catch (error) {
    console.error("❌ Error processing MQTT message:", error);
  }
});

console.log("✅ WebSocket Server running on ws://localhost:8080");
