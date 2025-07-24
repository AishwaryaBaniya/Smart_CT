const mongoose = require("mongoose")

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
    },
    filePath: {
      type: String,
      required: [true, "File path is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
    },
    scanner: {
      type: String,
      default: "Unknown Scanner",
    },
    scanType: {
      type: String,
      enum: ["CT", "MRI", "X-Ray", "Ultrasound"],
      default: "CT",
    },
    bodyPart: {
      type: String,
      enum: ["Abdomen", "Chest", "Head", "Pelvis", "Extremities"],
      default: "Abdomen",
    },
    contrast: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ["Processing", "Completed", "Failed", "Queued"],
        message: "Status must be Processing, Completed, Failed, or Queued",
      },
      default: "Queued",
      
    },
    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Emergency"],
      default: "Normal",
    },
    processingStarted: {
      type: Date,
    },
    processingCompleted: {
      type: Date,
    },
    processingTime: {
      type: Number, // in milliseconds
    },
    results: {
      overallRisk: {
        type: String,
        enum: ["Low Risk", "Moderate Risk", "High Risk"],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      findings: {
        bowel: {
          status: String,
          confidence: { type: Number, min: 0, max: 100 },
          severity: { type: String, enum: ["normal", "low", "moderate", "high"] },
          details: String,
        },
        extravasation: {
          status: String,
          confidence: { type: Number, min: 0, max: 100 },
          severity: { type: String, enum: ["normal", "low", "moderate", "high"] },
          details: String,
        },
        liver: {
          status: String,
          confidence: { type: Number, min: 0, max: 100 },
          severity: { type: String, enum: ["normal", "low", "moderate", "high"] },
          details: String,
        },
        kidney: {
          status: String,
          confidence: { type: Number, min: 0, max: 100 },
          severity: { type: String, enum: ["normal", "low", "moderate", "high"] },
          details: String,
        },
        spleen: {
          status: String,
          confidence: { type: Number, min: 0, max: 100 },
          severity: { type: String, enum: ["normal", "low", "moderate", "high"] },
          details: String,
        },
      },
      recommendations: [String],
      technicalDetails: {
        modelVersion: String,
        processingNode: String,
        algorithmUsed: String,
        qualityScore: { type: Number, min: 0, max: 100 },
      },
    },
    metadata: {
      patientAge: Number,
      patientGender: { type: String, enum: ["Male", "Female", "Other"] },
      clinicalHistory: String,
      urgency: { type: String, enum: ["Routine", "Urgent", "Emergency"] },
      referringPhysician: String,
      studyDate: Date,
      acquisitionParameters: {
        sliceThickness: Number,
        kvp: Number,
        mas: Number,
        reconstructionKernel: String,
      },
    },
    qualityControl: {
      imageQuality: { type: String, enum: ["Excellent", "Good", "Fair", "Poor"] },
      artifacts: [String],
      technicalIssues: [String],
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewDate: Date,
      approved: { type: Boolean, default: false },
    },
    annotations: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comment: String,
        timestamp: { type: Date, default: Date.now },
        type: { type: String, enum: ["Note", "Correction", "Question", "Approval"] },
      },
    ],
    tags: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
scanSchema.index({ userId: 1, createdAt: -1 })
scanSchema.index({ status: 1 })
scanSchema.index({ createdAt: -1 })
scanSchema.index({ "results.overallRisk": 1 })
scanSchema.index({ priority: 1, status: 1 })
scanSchema.index({ isDeleted: 1 })

// Virtual for processing duration
scanSchema.virtual("processingDuration").get(function () {
  if (this.processingStarted && this.processingCompleted) {
    return this.processingCompleted - this.processingStarted
  }
  return null
})

// Virtual for file type display
scanSchema.virtual("fileTypeDisplay").get(function () {
  const ext = this.originalName.split(".").pop().toLowerCase()
  switch (ext) {
    case "dcm":
      return "DICOM"
    case "nii":
      return "NIfTI"
    case "gz":
      return this.originalName.includes(".nii.") ? "NIfTI Compressed" : "Compressed"
    default:
      return "Medical Image"
  }
})

// Virtual for risk level color
scanSchema.virtual("riskColor").get(function () {
  if (!this.results || !this.results.overallRisk) return "gray"

  switch (this.results.overallRisk) {
    case "Low Risk":
      return "green"
    case "Moderate Risk":
      return "yellow"
    case "High Risk":
      return "red"
    default:
      return "gray"
  }
})

// Pre-save middleware
scanSchema.pre("save", function (next) {
  // Set processing times
  if (this.isModified("status")) {
    if (this.status === "Processing" && !this.processingStarted) {
      this.processingStarted = new Date()
    } else if (this.status === "Completed" && !this.processingCompleted) {
      this.processingCompleted = new Date()
      if (this.processingStarted) {
        this.processingTime = this.processingCompleted - this.processingStarted
      }
    }
  }

  next()
})

// Static method to get scan statistics
scanSchema.statics.getStats = async function (userId = null) {
  const matchStage = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {}

  const stats = await this.aggregate([
    { $match: { ...matchStage, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        processing: { $sum: { $cond: [{ $eq: ["$status", "Processing"] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ["$status", "Failed"] }, 1, 0] } },
        lowRisk: { $sum: { $cond: [{ $eq: ["$results.overallRisk", "Low Risk"] }, 1, 0] } },
        moderateRisk: { $sum: { $cond: [{ $eq: ["$results.overallRisk", "Moderate Risk"] }, 1, 0] } },
        highRisk: { $sum: { $cond: [{ $eq: ["$results.overallRisk", "High Risk"] }, 1, 0] } },
        avgProcessingTime: { $avg: "$processingTime" },
        totalFileSize: { $sum: "$fileSize" },
      },
    },
  ])

  return (
    stats[0] || {
      total: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      lowRisk: 0,
      moderateRisk: 0,
      highRisk: 0,
      avgProcessingTime: 0,
      totalFileSize: 0,
    }
  )
}

// Static method to get recent scans
scanSchema.statics.getRecentScans = async function (limit = 10, userId = null) {
  const matchStage = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {}

  return await this.find({ ...matchStage, isDeleted: { $ne: true } })
    .populate("userId", "firstName lastName email role")
    .sort({ createdAt: -1 })
    .limit(limit)
}

// Method to soft delete
scanSchema.methods.softDelete = function (deletedBy) {
  this.isDeleted = true
  this.deletedAt = new Date()
  this.deletedBy = deletedBy
  return this.save()
}

// Method to restore
scanSchema.methods.restore = function () {
  this.isDeleted = false
  this.deletedAt = undefined
  this.deletedBy = undefined
  return this.save()
}

module.exports = mongoose.model("Scan", scanSchema)
