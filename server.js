
import express from "express";
import cors from "cors";

const app = express();

// ✅ CORS enable karo
app.use(cors({
  origin: "*",   // ya sirf: "https://vikas0768.github.io"
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const shortid = require("shortid");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DATA_FILE = path.join(__dirname, "callbacks.json");

// file create if not exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ callbacks: [] }, null, 2));
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    return { callbacks: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 1️⃣ webhook endpoint (Zeydoo se callback yahan aayega)
app.post("/webhook", (req, res) => {
  if (WEBHOOK_SECRET) {
    const incoming = req.header("x-webhook-secret") || req.query.secret || "";
    if (incoming !== WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, message: "Invalid secret" });
    }
  }

  const payload = req.body || {};
  const entry = {
    id: shortid.generate(),
    receivedAt: new Date().toISOString(),
    raw: payload,
  };

  const data = readData();
  data.callbacks.unshift(entry);
  if (data.callbacks.length > 500) data.callbacks = data.callbacks.slice(0, 500);
  writeData(data);

  res.json({ ok: true, id: entry.id });
});

// 2️⃣ list callbacks
app.get("/api/callbacks", (req, res) => {
  const data = readData();
  res.json({ ok: true, callbacks: data.callbacks });
});

// 3️⃣ delete callback
app.delete("/api/callbacks/:id", (req, res) => {
  const data = readData();
  const idx = data.callbacks.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false });
  const removed = data.callbacks.splice(idx, 1);
  writeData(data);
  res.json({ ok: true, removed });
});

app.get("/", (req, res) => res.send("✅ Zeydoo Webhook Server Running!"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
