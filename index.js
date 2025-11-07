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

app.use(
  cors({
    origin: ["https://vikas0768.github.io", "http://localhost:3000"],
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

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

// ✅ Helper: extract user_id and status
function extractData(data) {
  const user_id =
    data.user_id || data.var || data.ymid || data.sub1 || "unknown_user";

  const status =
    data.status ||
    (data.payout && parseFloat(data.payout) > 0 ? "completed" : "pending");

  return { user_id, status };
}

// ✅ Save callback
async function saveCallback(entry) {
  const collection = db.collection("callbacks");
  await collection.insertOne(entry);
}

// ✅ Handle both GET & POST (Zeydoo callback)
app.all("/webhook", async (req, res) => {
  const incoming = req.query.secret || req.header("x-webhook-secret") || "";
  if (WEBHOOK_SECRET && incoming !== WEBHOOK_SECRET)
    return res.status(401).json({ ok: false, message: "Invalid secret" });

  const data = req.method === "POST" ? req.body : req.query;
  const { user_id, status } = extractData(data);

  const entry = {
    id: shortid.generate(),
    method: req.method,
    receivedAt: new Date().toISOString(),
    user_id,
    status,
    data,
  };

  await saveCallback(entry);
  console.log("✅ Callback received:", entry);

  res.json({ ok: true, id: entry.id, user_id, status });
});

// ✅ Get all callbacks (for dashboard)
app.get("/api/callbacks", async (req, res) => {
  const collection = db.collection("callbacks");
  const data = await collection.find().sort({ _id: -1 }).limit(500).toArray();
  res.json({ ok: true, callbacks: data });
});

// ✅ Delete one callback
app.delete("/api/callbacks/:id", async (req, res) => {
  const collection = db.collection("callbacks");
  await collection.deleteOne({ id: req.params.id });
  res.json({ ok: true });
});

// ✅ Root route
app.get("/", (req, res) =>
  res.send("✅ Zeydoo Webhook Server Running with MongoDB and User Status!")
);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


