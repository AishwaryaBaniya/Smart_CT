const express = require("express");
const router = express.Router();
const AboutModel = require("../models/About"); // adjust path if needed

// GET /api/about - Fetch current about information
router.get("/", async (req, res) => {
  try {
    const aboutData = await AboutModel.findOne().sort({ updatedAt: -1 }); // latest info
    if (!aboutData) return res.status(404).json({ error: "About info not found" });
    res.json(aboutData);
  } catch (err) {
    console.error("Error fetching about info:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

