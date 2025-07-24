const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const { authenticateToken } = require('./middleware/auth');
const systemSettingsRoutes = require("./routes/systemsettings")
const adminRoutes = require("./routes/adminroutes");
const userRoutes = require("./routes/users");
const aboutRoutes = require("./routes/about");





const app = express();
const PORT = 5000;

const { processScanQueue } = require('./workers/inferenceWorker');

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // ⏱️ Optional but still valid
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Middleware & routes

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    return callback(null, true); // Accept all origins
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

app.use("/api/settings", systemSettingsRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/users", userRoutes);

app.use("/api/about", aboutRoutes);



app.use(bodyParser.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const modelRoutes = require("./routes/models");
app.use("/api/models", modelRoutes);

const scanRoutes = require("./routes/scans");
app.use("/api/scans", authenticateToken, scanRoutes);

app.use("/uploads/models", express.static("uploads/models"));

// Now start server AFTER mounting all routes
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

// Interval for worker
setInterval(async () => {
  await processScanQueue();
}, 10000);