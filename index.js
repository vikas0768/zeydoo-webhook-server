const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const shortid = require("shortid");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "vik@zeydoo";

app.use(cors({
  origin: ["https://vikas0768.github.io", "http://localhost:3000"],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
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

  const entry = {
    id: shortid.generate(),
    method: "POST",
    receivedAt: new Date().toISOString(),
    raw: req.body || {},
  };

  const data = readData();
  data.callbacks.unshift(entry);
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
  writeData(data);

  res.json({ ok: true, id: entry.id });
});

// ✅ List callbacks
app.get("/api/callbacks", (req, res) => {
  res.json({ ok: true, callbacks: CALLBACKS });
});

// ✅ Delete callback
app.delete("/api/callbacks/:id", (req, res) => {
  CALLBACKS = CALLBACKS.filter(c => c.id !== req.params.id);
  res.json({ ok: true });
});

app.get("/", (req, res) => res.send("✅ Zeydoo Webhook Server Running!"));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
