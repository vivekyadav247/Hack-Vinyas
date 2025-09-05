const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Import models
const { User, Team, Admin, OTP } = require("../models");
const { schemas, validate } = require("../utils/validation");
const { requireAuth, loginRateLimit, logout } = require("../middlewares/auth");
const emailService = require("../utils/emailService");

// Admin login endpoint
router.post(
  "/admin/login",
  loginRateLimit.check,
  validate(schemas.adminLogin),
  async (req, res) => {
    try {
      console.log("🔍 Validating body:", req.body);
      console.log("✅ Validation passed");

      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findOne({ email: email.toLowerCase() });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Create session - Match with middleware expectation
      req.session.adminId = admin._id;
      req.session.admin = {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isAuthenticated: true,
      };

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      console.log("✅ Admin login successful:", admin.email);

      res.status(200).json({
        success: true,
        message: "Login successful!",
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: admin.permissions,
        },
        redirect: "/admin/home",
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed. Please try again.",
      });
    }
  }
);

// Team registration endpoint
router.post(
  "/register",
  validate(schemas.teamRegistration),
  async (req, res) => {
    try {
      console.log("📝 Team registration attempt");

      const {
        teamName,
        leaderName,
        leaderEmail,
        phone,
        psNumber,
        member2Name,
        member2Email,
        member2Phone,
        member3Name,
        member3Email,
        member3Phone,
        member4Name,
        member4Email,
        member4Phone,
        member5Name,
        member5Email,
        member5Phone,
        member6Name,
        member6Email,
        member6Phone,
      } = req.body;

      // Check if team already exists
      const existingTeam = await Team.findOne({
        $or: [
          { teamName: { $regex: new RegExp(`^${teamName}$`, "i") } },
          { leaderEmail: leaderEmail.toLowerCase() },
        ],
      });

      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: "Team name or leader email already registered",
        });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create new team
      const newTeam = new Team({
        teamName,
        leaderName,
        leaderEmail: leaderEmail.toLowerCase(),
        phone,
        psNumber: parseInt(psNumber),
        member2Name: member2Name || undefined,
        member2Email: member2Email ? member2Email.toLowerCase() : undefined,
        member2Phone: member2Phone || undefined,
        member3Name: member3Name || undefined,
        member3Email: member3Email ? member3Email.toLowerCase() : undefined,
        member3Phone: member3Phone || undefined,
        member4Name: member4Name || undefined,
        member4Email: member4Email ? member4Email.toLowerCase() : undefined,
        member4Phone: member4Phone || undefined,
        member5Name: member5Name || undefined,
        member5Email: member5Email ? member5Email.toLowerCase() : undefined,
        member5Phone: member5Phone || undefined,
        member6Name: member6Name || undefined,
        member6Email: member6Email ? member6Email.toLowerCase() : undefined,
        member6Phone: member6Phone || undefined,
        verificationToken,
        paymentStatus: "pending",
        isEmailVerified: false,
      });

      await newTeam.save();

      res.status(201).json({
        success: true,
        message: "Team registered successfully!",
        team: {
          id: newTeam._id,
          teamName: newTeam.teamName,
          leaderName: newTeam.leaderName,
          leaderEmail: newTeam.leaderEmail,
          psNumber: newTeam.psNumber,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed. Please try again.",
      });
    }
  }
);

// Admin logout
router.post("/admin/logout", requireAuth, logout);

module.exports = router;
