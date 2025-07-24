const express = require("express");
const multer = require("multer");
const path = require("path");
const Model = require("../models/Model");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/models"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    const { name, version } = req.body;
    const cleanName = name?.replace(/[^a-zA-Z0-9_-]/g, "_") || "model";
    const cleanVersion = version?.replace(/[^a-zA-Z0-9_.-]/g, "_") || "v0";
    const ext = path.extname(file.originalname) || ".pth";
    const filename = `${cleanName}_v${cleanVersion}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// ========================= ROUTES ==============================

// POST /api/models/upload — Upload and deploy new model
router.post("/upload", authenticateToken, upload.single("model"), async (req, res) => {
  try {
    const { name, version, accuracy } = req.body;
    const file = req.file;

    if (!file || !file.originalname.endsWith(".pth")) {
      return res.status(400).json({ message: "Only .pth files are allowed" });
    }

    if (!name || !version || !accuracy) {
      return res.status(400).json({ message: "name, version, and accuracy are required" });
    }

    // Set existing models to "Previous"
    await Model.updateMany({ status: "Active" }, { status: "Previous" });

    // Save new model
    const newModel = new Model({
      name,
      version,
      accuracy: parseFloat(accuracy),
      deployedDate: new Date().toISOString().split("T")[0],
      status: "Active",
      filePath: file.path,
      uploadedBy: req.user.email,
    });

    await newModel.save();

    res.status(201).json({ message: "Model uploaded and deployed", model: newModel });
  } catch (err) {
    console.error("Model upload error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/models/current — Fetch active model
router.get("/current", async (req, res) => {
  try {
    const currentModel = await Model.findOne({ status: "Active" }).sort({ deployedDate: -1 });
    if (!currentModel) return res.status(404).json({ message: "No active model found" });
    res.json(currentModel);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/models/history — Fetch all models
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const models = await Model.find().sort({ uploadDate: -1 });
    res.json(models);
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ message: "Failed to fetch models" });
  }
});

//  EXPORT ROUTER
module.exports = router;