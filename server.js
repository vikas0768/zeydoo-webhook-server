const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const shortid = require("shortid");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "vik@zeydoo"; // fallback

app.use(cors({
  origin: ["https://vikas0768.github.io", "http://localhost:3000"],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let CALLBACKS = [];

function readData() {
  return { callbacks: CALLBACKS };
}

function writeData(data) {
  CALLBACKS = data.callbacks;
}

// ✅ Webhook POST
app.post("/webhook", (req, res) => {
  const incoming = req.header("x-webhook-secret") || req.query.secret || "";
  if (WEBHOOK_SECRET && incoming !== WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, message: "Invalid secret" });
  }

  const payload = req.body || {};
  const entry = {
    id: shortid.generate(),
    method: "POST",
    receivedAt: new Date().toISOString(),
    raw: payload,
  };

  const data = readData();
  data.callbacks.unshift(entry);
  writeData(data);

  res.json({ ok: true, id: entry.id });
});

// ✅ Webhook GET (for browser or Zeydoo GET callbacks)
app.get("/webhook", (req, res) => {
  const incoming = req.query.secret || "";
  if (WEBHOOK_SECRET && incoming !== WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, message: "Invalid secret" });
  }

  const payload = req.query || {};
  const entry = {
    id: shortid.generate(),
    method: "GET",
    receivedAt: new Date().toISOString(),
    raw: payload,
  };

  const data = readData();
  data.callbacks.unshift(entry);
  writeData(data);

  res.json({ ok: true, id: entry.id });
});

// ✅ List callbacks
app.get("/api/callbacks", (req, res) => {
  const data = readData();
  res.json({ ok: true, callbacks: data.callbacks });
});

// ✅ Delete callback
app.delete("/api/callbacks/:id", (req, res) => {
  const data = readData();
  const idx = data.callbacks.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false });
  const removed = data.callbacks.splice(idx, 1);
  writeData(data);
  res.json({ ok: true, removed });
});

// ✅ Root
app.get("/", (req, res) => res.send("✅ Zeydoo Webhook Server Running!"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
