const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const shortid = require("shortid");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

// ✅ Enable CORS (for GitHub frontend)
app.use(cors({
  origin: [
    "https://vikas0768.github.io",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Use in-memory store instead of file system
let CALLBACKS = [];

function readData() {
  return { callbacks: CALLBACKS };
}

function writeData(data) {
  CALLBACKS = data.callbacks;
}

// ✅ 1️⃣ Webhook endpoint (Zeydoo GET or POST dono send kar sakta hai)
app.all("/webhook", (req, res) => {
  const incoming = req.header("x-webhook-secret") || req.query.secret || "";
  if (WEBHOOK_SECRET && incoming !== WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, message: "Invalid secret" });
  }

  // ✅ Zeydoo kabhi POST body me, kabhi GET query me bhejta hai
  const payload = req.method === "POST" ? req.body : req.query;

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

// 2️⃣ List callbacks
app.get("/api/callbacks", (req, res) => {
  const data = readData();
  res.json({ ok: true, callbacks: data.callbacks });
});

// 3️⃣ Delete callback
app.delete("/api/callbacks/:id", (req, res) => {
  const data = readData();
  const idx = data.callbacks.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false });
  const removed = data.callbacks.splice(idx, 1);
  writeData(data);
  res.json({ ok: true, removed });
});

// Root route
app.get("/", (req, res) => res.send("✅ Zeydoo Webhook Server Running!"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
