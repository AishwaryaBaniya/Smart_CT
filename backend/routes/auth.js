const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const rateLimit = require("express-rate-limit")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})


// Apply rate limiting to login and register
router.use("/login", authLimiter)
router.use("/register", authLimiter)

// Register route
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, dob, gender, phone, role } = req.body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "First name, last name, email, and password are required",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      })
    }

    // Create new user
    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save middleware
      dob: dob ? new Date(dob) : undefined,
      gender,
      phone: phone?.trim(),
      role: role || "Doctor",
      isAdmin: email.toLowerCase() === "admin@example.com", // Make admin@example.com an admin
    })

    await user.save()
    await Activity.create({
     type: "user",
     user: newUser.name || newUser.email,
     action: "Created a new user account",
     status: "success",
   });

   await Activity.create({
     type: "system",
     user: "System",
     action: "Updated model to version 2.1.3",
     status: "info",
   });



    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        message: "Validation error",
        errors,
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email already exists",
      })
    }

    res.status(500).json({ message: "Internal server error" })
  }
})

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      })
    }

    // Find user and check credentials
    const user = await User.findByCredentials(email, password)

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(400).json({ message: error.message })
  }
})

// Refresh token route
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")

    if (!user || user.status !== "Active") {
      return res.status(401).json({ message: "User not found or inactive" })
    }

    // Generate new token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.json({
      message: "Token refreshed successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error("Token refresh error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Logout route (optional - mainly for client-side token removal)
router.post("/logout", authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can log the action or add token to blacklist if needed
  res.json({ message: "Logged out successfully" })
})

// Verify token route
router.get("/verify", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error("Token verification error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

module.exports = router
