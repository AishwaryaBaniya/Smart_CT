const express = require("express")
const router = express.Router()
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")

// Get all users (already exists for UserManagement)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})


module.exports = router
