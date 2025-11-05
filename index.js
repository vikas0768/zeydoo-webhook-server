const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const shortid = require("shortid");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "vik@zeydoo";

// ✅ Enable CORS for your GitHub dashboard
app.use(cors({
  origin: ["https://vikas0768.github.io", "http://localhost:3000"],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ JSON file for storing callbacks permanently
const DATA_FILE = path.join(__dirname, "callbacks.json");

// Create file if not exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ callbacks: [] }, null, 2));
}

// Helpers for reading/writing file
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

// ✅ Webhook POST
app.post("/webhook", (req, res) => {
  const incoming = req.header("x-webhook-secret") || req.query.secret || "";
  if (WEBHOOK_SECRET && incoming !== WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, message: "Invalid secret" });
  }

  const entry = {
    id: shortid.generate(),
    method: "POST",
    receivedAt: new Date().toISOString(),
    raw: req.body || {},
  };

  const data = readData();
  data.callbacks.unshift(entry);
  if (data.callbacks.length > 1000) data.callbacks = data.callbacks.slice(0, 1000);
  writeData(data);

  res.json({ ok: true, id: entry.id });
});

// ✅ Webhook GET
app.get("/webhook", (req, res) => {
  const incoming = req.query.secret || "";
  if (WEBHOOK_SECRET && incoming !== WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, message: "Invalid secret" });
  }

  const entry = {
    id: shortid.generate(),
    method: "GET",
    receivedAt: new Date().toISOString(),
    raw: req.query || {},
  };

  const data = readData();
  data.callbacks.unshift(entry);
  if (data.callbacks.length > 1000) data.callbacks = data.callbacks.slice(0, 1000);
  writeData(data);

  res.json({ ok: true, id: entry.id });
});

// ✅ Get all callbacks
app.get("/api/callbacks", (req, res) => {
  const data = readData();
  res.json({ ok: true, callbacks: data.callbacks });
});

// ✅ Delete a specific callback
app.delete("/api/callbacks/:id", (req, res) => {
  const data = readData();
  data.callbacks = data.callbacks.filter(c => c.id !== req.params.id);
  writeData(data);
  res.json({ ok: true });
});

app.get("/", (req, res) => res.send("✅ Zeydoo Webhook Server Running with JSON storage!"));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
