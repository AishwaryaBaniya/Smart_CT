const express = require("express")
const multer = require("multer")
const mongoose = require("mongoose")
const Scan = require("../models/Scan")
const { authenticateToken } = require("../middleware/auth")
const Queue = require("bull")
const fs = require("fs")
const path = require("path")
const Activity = require("../models/Activity");


const router = express.Router()

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "..", "uploads", "scans")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Bull queue
const scanProcessingQueue = new Queue("scan-processing", "redis://127.0.0.1:6379")

router.get("/:scanId", authenticateToken, async (req, res) => {
  try {
    const { scanId } = req.params

    if (!mongoose.Types.ObjectId.isValid(scanId)) {
      return res.status(400).json({ message: "Invalid scan ID" })
    }

    const scan = await Scan.findById(scanId)
    if (!scan) {
      return res.status(404).json({ message: "Scan not found" })
    }

    // Safely format createdAt
    const createdAt = scan.createdAt instanceof Date ? scan.createdAt.toISOString() : null
    const date = createdAt ? createdAt.split("T")[0] : "Unknown"
    const time = createdAt ? createdAt.split("T")[1]?.split(".")[0] : "Unknown"

    return res.json({
      scanId: scan._id,
      date,
      time,
      scanner: scan.scanner || "Unknown",
      overallRisk: scan.results?.overallRisk || "Unknown",
      confidence: scan.results?.confidence || 0,
      findings: scan.results?.findings || {},
      recommendations: scan.results?.recommendations || [],
      results: scan.results || {},
    })
  } catch (error) {
    console.error("Error fetching scan:", error)
    return res.status(500).json({ message: "Server error" })
  }
})



const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}_${file.originalname}`
    cb(null, unique)
  },
})

const upload = multer({ storage })

router.post("/upload", authenticateToken, upload.single("scan"), async (req, res) => {
  try {
    const file = req.file
    const { fileType, scanType, bodyPart, contrast, priority } = req.body

    if (!file) return res.status(400).json({ message: "No file uploaded" })
    if (!fileType) return res.status(400).json({ message: "fileType is required" })

    const { userId } = req.user

    const newScan = new Scan({
      userId,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      fileType,
      scanType: scanType || "CT",
      bodyPart: bodyPart || "Abdomen",
      contrast: contrast === "true",
      priority: priority || "Normal",
      status: "Queued",
    })

    await newScan.save()
    // After successful scan creation:
    await Activity.create({
      type: "scan",
      user: req.user.name || req.user.email,
      action: "Uploaded a new CT scan",
      status: "success",
    });


    await scanProcessingQueue.add({ scanId: newScan._id })

    res.status(201).json({ message: "Scan uploaded and queued", scanId: newScan._id })
  } catch (err) {
    console.error("Scan upload error:", err)
    res.status(500).json({ message: "Server error" })
  }
})


router.get("/", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user
    const scans = await Scan.find({ userId }).sort({ date: -1 })

    // Add this mapping to include ISO date string
    const response = scans.map((scan) => ({
      _id: scan._id,
      scanner: scan.scanner || "Unknown",
      date: scan.createdAt?.toISOString() || null, // <-- THIS LINE is crucial
      fileType: scan.fileType,
      status: scan.status,
      overallRisk: scan.results?.overallRisk || "Unknown",
      findings: scan.results?.findings || {},
    }))

    res.json(response)
  } catch (err) {
    console.error("Error fetching scans:", err)
    res.status(500).json({ message: "Server error" })
  }
})


module.exports = router
