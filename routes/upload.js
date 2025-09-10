const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { Team, PPTSubmission } = require("../models");
const { uploadMiddleware, fileUtils } = require("../middlewares/upload");
const { requireAuth, requirePermission } = require("../middlewares/auth");
const { OTP } = require("../models");

// Check if team has already submitted PPT
router.post("/check-ppt-status", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find team by leader email
    const team = await Team.findOne({ leaderEmail: email.toLowerCase() });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if PPT already submitted
    const existingSubmission = await PPTSubmission.findOne({
      teamId: team._id,
    });

    if (existingSubmission) {
      return res.status(200).json({
        success: true,
        message: "PPT already submitted",
        status: "already_submitted",
        teamName: team.teamName,
        submission: {
          id: existingSubmission._id,
          fileName: existingSubmission.pptFile.originalName,
          fileSize: fileUtils.formatFileSize(existingSubmission.pptFile.size),
          submissionDate: existingSubmission.submissionDate,
          status: existingSubmission.status,
          version: existingSubmission.version,
          isLateSubmission: existingSubmission.isLateSubmission,
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "No PPT submitted yet",
        status: "not_submitted",
        teamName: team.teamName,
        paymentStatus: team.paymentStatus,
      });
    }
  } catch (error) {
    console.error("PPT status check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check PPT status",
    });
  }
});

// PPT submission with email verification
router.post(
  "/ppt-submission-verified",
  uploadMiddleware.uploadPPT,
  async (req, res) => {
    try {
      console.log("📥 PPT Submission Request Body:", req.body);
      console.log(
        "📁 Uploaded File:",
        req.file ? req.file.originalname : "No file"
      );

      const { email, otp } = req.body;

      console.log("🔍 Extracted Data:", {
        email,
        otp,
      });

      if (!email || !otp) {
        // Delete uploaded file if validation fails
        if (req.fileData) {
          fileUtils.deleteFile(req.fileData.path);
        }

        return res.status(400).json({
          success: false,
          message: "Email and OTP are required",
        });
      }

      // Verify OTP (check both used and unused OTPs since verification happens on frontend)
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        otp: otp,
        purpose: "ppt_submission",
        expiresAt: { $gt: new Date() },
      });

      if (!otpRecord) {
        // Delete uploaded file if OTP verification fails
        if (req.fileData) {
          fileUtils.deleteFile(req.fileData.path);
        }

        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      // Find team by leader email
      const team = await Team.findOne({ leaderEmail: email.toLowerCase() });

      if (!team) {
        // Delete uploaded file if team not found
        if (req.fileData) {
          fileUtils.deleteFile(req.fileData.path);
        }

        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }

      // Check if PPT already submitted
      const existingSubmission = await PPTSubmission.findOne({
        teamId: team._id,
      });

      if (existingSubmission) {
        return res.status(200).json({
          success: true,
          message: "PPT already submitted for this team",
          status: "already_submitted",
          submission: {
            id: existingSubmission._id,
            teamName: existingSubmission.teamName,
            fileName: existingSubmission.pptFile.originalName,
            fileSize: fileUtils.formatFileSize(existingSubmission.pptFile.size),
            submissionDate: existingSubmission.submissionDate,
            status: existingSubmission.status,
            version: existingSubmission.version,
            isLateSubmission: existingSubmission.isLateSubmission,
          },
        });
      }

      // Mark OTP as used (if not already used)
      if (!otpRecord.isUsed) {
        otpRecord.isUsed = true;
        await otpRecord.save();
      }

      // Check if submission deadline has passed (example: 7 days from registration)
      const submissionDeadline = new Date(team.registrationDate);
      submissionDeadline.setDate(submissionDeadline.getDate() + 7);

      const isLateSubmission = new Date() > submissionDeadline;

      // Create PPT submission record
      const pptSubmission = new PPTSubmission({
        teamId: team._id,
        teamName: team.teamName,
        leaderEmail: team.leaderEmail,
        pptFile: {
          url: req.file.path, // Cloudinary URL
          public_id: req.file.filename, // Cloudinary public_id
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        isLateSubmission,
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent") || "",
          submissionDeadline,
        },
      });

      await pptSubmission.save();

      res.status(201).json({
        success: true,
        message: `PPT submitted successfully${
          isLateSubmission ? " (Late submission)" : ""
        }!`,
        submission: {
          id: pptSubmission._id,
          teamName: pptSubmission.teamName,
          leaderEmail: pptSubmission.leaderEmail,
          fileName: pptSubmission.pptFile.originalName,
          fileSize: fileUtils.formatFileSize(pptSubmission.pptFile.size),
          submissionDate: pptSubmission.submissionDate,
          status: pptSubmission.status,
          version: pptSubmission.version,
          isLateSubmission: pptSubmission.isLateSubmission,
        },
      });
    } catch (error) {
      console.error("PPT submission error:", error);

      // Delete uploaded file on error
      if (req.fileData) {
        fileUtils.deleteFile(req.fileData.path);
      }

      res.status(500).json({
        success: false,
        message: "Failed to submit PPT. Please try again.",
      });
    }
  }
);

// PPT submission endpoint
router.post("/ppt-submission", uploadMiddleware.uploadPPT, async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: "Team ID is required",
      });
    }

    // Verify team exists and payment is verified
    const team = await Team.findById(teamId);

    if (!team) {
      // Delete uploaded file if team not found
      if (req.fileData) {
        fileUtils.deleteFile(req.fileData.path);
      }

      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (team.paymentStatus !== "verified" && team.paymentStatus !== "paid") {
      // Delete uploaded file if payment not verified/paid
      if (req.fileData) {
        fileUtils.deleteFile(req.fileData.path);
      }

      return res.status(403).json({
        success: false,
        message: "Payment must be verified or paid before submitting PPT",
      });
    }

    // Check if PPT already submitted
    const existingSubmission = await PPTSubmission.findOne({
      teamId: team._id,
    });

    if (existingSubmission) {
      return res.status(200).json({
        success: true,
        message: "PPT already submitted for this team",
        status: "already_submitted",
        submission: {
          id: existingSubmission._id,
          teamName: existingSubmission.teamName,
          fileName: existingSubmission.pptFile.originalName,
          fileSize: fileUtils.formatFileSize(existingSubmission.pptFile.size),
          submissionDate: existingSubmission.submissionDate,
          status: existingSubmission.status,
          version: existingSubmission.version,
          isLateSubmission: existingSubmission.isLateSubmission,
        },
      });
    }

    // Check if submission deadline has passed (example: 7 days from registration)
    const submissionDeadline = new Date(team.registrationDate);
    submissionDeadline.setDate(submissionDeadline.getDate() + 7);

    const isLateSubmission = new Date() > submissionDeadline;

    // Create PPT submission record
    const pptSubmission = new PPTSubmission({
      teamId: team._id,
      teamName: team.teamName,
      leaderEmail: team.leaderEmail,
      pptFile: {
        url: req.file.path, // Cloudinary URL
        public_id: req.file.filename, // Cloudinary public_id
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
      isLateSubmission,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent") || "",
        submissionDeadline,
      },
    });

    await pptSubmission.save();

    res.status(201).json({
      success: true,
      message: `PPT submitted successfully${
        isLateSubmission ? " (Late submission)" : ""
      }!`,
      submission: {
        id: pptSubmission._id,
        teamName: pptSubmission.teamName,
        fileName: pptSubmission.pptFile.original_name,
        fileSize: fileUtils.formatFileSize(pptSubmission.pptFile.size),
        submissionDate: pptSubmission.submissionDate,
        status: pptSubmission.status,
        version: pptSubmission.version,
        isLateSubmission: pptSubmission.isLateSubmission,
      },
    });
  } catch (error) {
    console.error("PPT submission error:", error);

    // Delete uploaded file on error
    if (req.fileData) {
      fileUtils.deleteFile(req.fileData.path);
    }

    res.status(500).json({
      success: false,
      message: "PPT submission failed. Please try again.",
    });
  }
});

// Payment screenshot upload endpoint
router.post(
  "/payment-screenshot",
  uploadMiddleware.uploadPaymentScreenshot,
  async (req, res) => {
    try {
      const { teamId, transactionId, utrNumber } = req.body;

      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: "Team ID is required",
        });
      }

      // Verify team exists
      const team = await Team.findById(teamId);

      if (!team) {
        // Delete uploaded file if team not found
        if (req.fileData) {
          fileUtils.deleteFile(req.fileData.path);
        }

        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }

      // Update team payment details
      const updateData = {
        paymentStatus: "paid",
      };

      if (transactionId) {
        updateData["paymentDetails.transactionId"] = transactionId;
      }

      if (utrNumber) {
        updateData["paymentDetails.utrNumber"] = utrNumber;
      }

      if (req.fileData) {
        updateData["paymentDetails.paymentScreenshot"] = req.fileData.path;
      }

      updateData["paymentDetails.paymentDate"] = new Date();

      await Team.findByIdAndUpdate(teamId, updateData);

      res.json({
        success: true,
        message:
          "Payment details uploaded successfully! Your payment is under review.",
        paymentDetails: {
          status: "paid",
          transactionId: transactionId || null,
          utrNumber: utrNumber || null,
          screenshot: req.fileData ? req.fileData.filename : null,
          uploadDate: new Date(),
        },
      });
    } catch (error) {
      console.error("Payment screenshot upload error:", error);

      // Delete uploaded file on error
      if (req.fileData) {
        fileUtils.deleteFile(req.fileData.path);
      }

      res.status(500).json({
        success: false,
        message: "Payment screenshot upload failed. Please try again.",
      });
    }
  }
);

// Get uploaded file (with authentication for sensitive files)
router.get("/file/:type/:filename", async (req, res) => {
  try {
    const { type, filename } = req.params;

    // Validate parameters
    if (!type || !filename) {
      return res.status(400).json({
        success: false,
        message: "Type and filename are required",
      });
    }

    // Define allowed file types and their directories
    const allowedTypes = {
      ppt: "ppt-submissions",
      payment: "payment-screenshots",
      general: "general",
    };

    if (!allowedTypes[type]) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type",
      });
    }

    const filePath = path.join(
      __dirname,
      "../uploads",
      allowedTypes[type],
      filename
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // For sensitive files (payment screenshots, PPTs), require authentication
    if (type === "payment" || type === "ppt") {
      // Check if admin is authenticated
      if (!req.session || !req.session.adminId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to access this file",
        });
      }
    }

    // Get file info
    const fileInfo = fileUtils.getFileInfo(filePath);

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".pdf": "application/pdf",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.setHeader("Content-Length", fileInfo.size);
    res.setHeader("Cache-Control", "private, max-age=3600"); // Cache for 1 hour

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error("File serve error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to serve file",
    });
  }
});

// Get all PPT submissions (admin only)
router.get(
  "/ppt-submissions",
  requireAuth,
  requirePermission("canViewTeams"),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = "submissionDate",
        sortOrder = "desc",
      } = req.query;

      // Build filter query
      const filter = {};

      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { teamName: { $regex: search, $options: "i" } },
          { leaderEmail: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort query
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Execute query with pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const [submissions, total] = await Promise.all([
        PPTSubmission.find(filter)
          .populate("teamId", "teamName leaderName paymentStatus")
          .populate("reviewedBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        PPTSubmission.countDocuments(filter),
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        submissions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalSubmissions: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error("Get PPT submissions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve PPT submissions",
      });
    }
  }
);

// Update PPT submission review (admin only)
router.put(
  "/ppt-submissions/:id/review",
  requireAuth,
  requirePermission("canEditTeams"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, comments, score } = req.body;

      const submission = await PPTSubmission.findById(id);

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "PPT submission not found",
        });
      }

      // Update review
      await submission.updateReview(status, comments, score, req.admin._id);

      res.json({
        success: true,
        message: "PPT review updated successfully",
        submission,
      });
    } catch (error) {
      console.error("Update PPT review error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update PPT review",
      });
    }
  }
);

// Get file upload statistics
router.get(
  "/stats/uploads",
  requireAuth,
  requirePermission("canAccessReports"),
  async (req, res) => {
    try {
      const [pptStats, paymentStats] = await Promise.all([
        PPTSubmission.getStats(),
        Team.aggregate([
          {
            $group: {
              _id: "$paymentStatus",
              count: { $sum: 1 },
              totalAmount: { $sum: "$registrationFee" },
            },
          },
        ]),
      ]);

      res.json({
        success: true,
        stats: {
          pptSubmissions: pptStats,
          payments: paymentStats,
        },
      });
    } catch (error) {
      console.error("Get upload stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve upload statistics",
      });
    }
  }
);

// Delete uploaded file (admin only)
router.delete(
  "/file/:type/:filename",
  requireAuth,
  requirePermission("canDeleteTeams"),
  async (req, res) => {
    try {
      const { type, filename } = req.params;

      const allowedTypes = {
        ppt: "ppt-submissions",
        payment: "payment-screenshots",
        general: "general",
      };

      if (!allowedTypes[type]) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type",
        });
      }

      const filePath = path.join(
        __dirname,
        "../uploads",
        allowedTypes[type],
        filename
      );

      const deleted = fileUtils.deleteFile(filePath);

      if (deleted) {
        res.json({
          success: true,
          message: "File deleted successfully",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "File not found or already deleted",
        });
      }
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete file",
      });
    }
  }
);

module.exports = router;
