const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const shortid = require("shortid");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "vik@zeydoo";
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "zeydoo_webhook";

app.use(cors({
  origin: ["https://vikas0768.github.io", "http://localhost:3000"],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ MongoDB connect
let db;
async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("✅ Connected to MongoDB");
}
connectDB();

// ✅ Webhook (POST or GET)
async function saveCallback(entry) {
  const collection = db.collection("callbacks");
  await collection.insertOne(entry);
}

// POST
app.post("/webhook", async (req, res) => {
  const incoming = req.query.secret || req.header("x-webhook-secret") || "";
  if (WEBHOOK_SECRET && incoming !== WEBHOOK_SECRET)
    return res.status(401).json({ ok: false, message: "Invalid secret" });

  const entry = {
    id: shortid.generate(),
    method: "POST",
    receivedAt: new Date().toISOString(),
    data: req.body || {},
  };

  await saveCallback(entry);
  res.json({ ok: true, id: entry.id });
});

// GET
app.get("/webhook", async (req, res) => {
  const incoming = req.query.secret || "";
  if (WEBHOOK_SECRET && incoming !== WEBHOOK_SECRET)
    return res.status(401).json({ ok: false, message: "Invalid secret" });

  const entry = {
    id: shortid.generate(),
    method: "GET",
    receivedAt: new Date().toISOString(),
    data: req.query || {},
  };

  await saveCallback(entry);
  res.json({ ok: true, id: entry.id });
});

// ✅ List callbacks
app.get("/api/callbacks", async (req, res) => {
  const collection = db.collection("callbacks");
  const data = await collection.find().sort({ _id: -1 }).limit(500).toArray();
  res.json({ ok: true, callbacks: data });
});

// ✅ Delete callback
app.delete("/api/callbacks/:id", async (req, res) => {
  const collection = db.collection("callbacks");
  await collection.deleteOne({ id: req.params.id });
  res.json({ ok: true });
});

app.get("/", (req, res) => res.send("✅ Zeydoo Webhook Server Running with MongoDB!"));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
