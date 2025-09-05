const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
const { Team, PPTSubmission } = require("../models");
const path = require("path");
const fs = require("fs");

// Admin Dashboard Data API
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    console.log("📊 Loading admin dashboard data...");

    // Get all teams with their data
    const teams = await Team.find()
      .select(
        "teamName leaderName leaderEnrollment leaderEmail leaderPhone collegeName transactionId paymentStatus createdAt member2Name member2Enrollment member2Email member3Name member3Enrollment member3Email member4Name member4Enrollment member4Email member5Name member5Enrollment member5Email member6Name member6Enrollment member6Email"
      )
      .sort({ createdAt: -1 })
      .lean();

    // Get PPT submissions count
    const totalSubmissions = await PPTSubmission.countDocuments();

    // Calculate statistics
    const stats = {
      totalTeams: teams.length,
      totalSubmissions: totalSubmissions,
      pendingSubmissions: teams.length - totalSubmissions,
      paidTeams: teams.filter((team) => team.paymentStatus === "paid").length,
      pendingTeams: teams.filter((team) => team.paymentStatus === "pending")
        .length,
      totalRevenue:
        teams.filter((team) => team.paymentStatus === "paid").length * 600,
    };

    console.log(`✅ Dashboard data loaded: ${stats.totalTeams} teams`);

    // Format teams data properly
    const formattedTeams = teams.map((team) => {
      // Build members array from individual fields
      const members = [];

      // Add leader as first member
      members.push({
        name: team.leaderName,
        email: team.leaderEmail,
        enrollment: team.leaderEnrollment,
        phone: team.leaderPhone || "",
        role: "Leader",
      });

      // Add other members
      for (let i = 2; i <= 6; i++) {
        const memberName = team[`member${i}Name`];
        if (memberName && memberName.trim()) {
          members.push({
            name: memberName,
            email: team[`member${i}Email`] || "",
            enrollment: team[`member${i}Enrollment`] || "",
            phone: "",
            role: `Member ${i}`,
          });
        }
      }

      return {
        ...team,
        college: team.collegeName,
        leadEmail: team.leaderEmail,
        leadPhone: team.leaderPhone,
        leaderEnrollment: team.leaderEnrollment,
        transactionId: team.transactionId,
        members: members,
        registrationDate: team.createdAt,
      };
    });

    res.json({
      success: true,
      teams: formattedTeams,
      stats,
    });
  } catch (error) {
    console.error("❌ Dashboard data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
});

// Test route to debug PPT issue
router.get("/test-ppt/:teamId", async (req, res) => {
  try {
    console.log(`🔍 Testing PPT for team: ${req.params.teamId}`);

    const submission = await PPTSubmission.findOne({
      teamId: req.params.teamId,
    });

    if (!submission) {
      return res.json({
        success: false,
        message: "PPT submission not found",
        teamId: req.params.teamId,
      });
    }

    const response = {
      success: true,
      teamId: req.params.teamId,
      originalUrl: submission.pptFile.url,
      fileName: submission.pptFile.originalName,
    };

    // Fix URL if needed
    if (
      submission.pptFile.url.includes("/image/upload/") &&
      submission.pptFile.originalName.toLowerCase().includes(".pdf")
    ) {
      response.fixedUrl = submission.pptFile.url.replace(
        "/image/upload/",
        "/raw/upload/"
      );
    }

    return res.json(response);
  } catch (error) {
    console.error("❌ Test PPT error:", error);
    return res.json({
      success: false,
      error: error.message,
    });
  }
});

// Get team PPT file
router.get("/teams/:teamId/ppt", requireAuth, async (req, res) => {
  try {
    console.log(`📄 Fetching PPT for team: ${req.params.teamId}`);

    const submission = await PPTSubmission.findOne({
      teamId: req.params.teamId,
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "PPT submission not found",
      });
    }

    // For Cloudinary files, fetch and serve with proper headers
    if (submission.pptFile.url) {
      console.log(`✅ PPT URL found: ${submission.pptFile.url}`);
      console.log(`✅ File name: ${submission.pptFile.originalName}`);

      // Fix Cloudinary URL for non-image files (replace /image/ with /raw/)
      let fileUrl = submission.pptFile.url;
      if (
        fileUrl.includes("/image/upload/") &&
        (submission.pptFile.originalName.toLowerCase().includes(".pdf") ||
          submission.pptFile.originalName.toLowerCase().includes(".ppt"))
      ) {
        fileUrl = fileUrl.replace("/image/upload/", "/raw/upload/");
        console.log(`✅ Fixed URL for non-image file: ${fileUrl}`);
      }

      // Set proper headers based on file type
      const fileName = submission.pptFile.originalName || "presentation";
      const fileExt = fileName.split(".").pop()?.toLowerCase();

      console.log(`✅ File extension: ${fileExt}`);

      // Set Content-Type based on actual file extension
      if (fileExt === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
      } else if (fileExt === "ppt") {
        res.setHeader("Content-Type", "application/vnd.ms-powerpoint");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
      } else if (fileExt === "pptx") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
      } else {
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
      }

      // Fetch file from Cloudinary and pipe it to response
      try {
        const https = require("https");
        const http = require("http");

        const protocol = fileUrl.startsWith("https:") ? https : http;

        const request = protocol.get(fileUrl, (cloudinaryResponse) => {
          // Set additional headers from Cloudinary if needed
          res.setHeader(
            "Content-Length",
            cloudinaryResponse.headers["content-length"]
          );

          // Pipe the file content
          cloudinaryResponse.pipe(res);
        });

        request.on("error", (error) => {
          console.error("❌ Error fetching from Cloudinary:", error);
          res.status(500).json({
            success: false,
            message: "Failed to fetch file from cloud storage",
          });
        });

        return; // Don't execute further code
      } catch (fetchError) {
        console.error("❌ File fetch error:", fetchError);
        // Fallback to redirect if fetch fails
        return res.redirect(fileUrl);
      }
    }

    return res.status(404).json({
      success: false,
      message: "PPT file URL not found",
    });
  } catch (error) {
    console.error("❌ PPT fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PPT",
      error: error.message,
    });
  }
});

// Get team screenshot
router.get("/teams/:teamId/screenshot", requireAuth, async (req, res) => {
  try {
    console.log(`📸 Fetching screenshot for team: ${req.params.teamId}`);

    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if screenshot URL exists in database (Cloudinary)
    if (!team.paymentScreenshot || !team.paymentScreenshot.url) {
      return res.status(404).json({
        success: false,
        message: "Payment screenshot not found",
      });
    }

    console.log(`✅ Redirecting to screenshot for team: ${team.teamName}`);

    // Redirect to Cloudinary URL
    return res.redirect(team.paymentScreenshot.url);
  } catch (error) {
    console.error("❌ Screenshot fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch screenshot",
      error: error.message,
    });
  }
});

// Update team payment status
router.patch("/teams/:teamId/payment-status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["paid", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const team = await Team.findByIdAndUpdate(
      req.params.teamId,
      { paymentStatus: status },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.json({
      success: true,
      message: "Payment status updated successfully",
      team,
    });
  } catch (error) {
    console.error("Payment status update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
});

// Delete team
router.delete("/teams/:teamId", requireAuth, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Also delete associated PPT submission if exists
    await PPTSubmission.deleteOne({ teamId: req.params.teamId });

    res.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Team deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete team",
    });
  }
});

// Get all PPT submissions
router.get("/ppt-submissions", requireAuth, async (req, res) => {
  try {
    const submissions = await PPTSubmission.find()
      .populate("teamId", "teamName leaderName leaderEmail")
      .sort({ submittedAt: -1 })
      .lean();

    res.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("PPT submissions fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PPT submissions",
    });
  }
});

// Send Verification Mail Route
router.post("/send-verification-mail", requireAuth, async (req, res) => {
  try {
    const { teamId, teamName, leaderEmail } = req.body;

    console.log(
      `📧 Sending verification mail to team: ${teamName} (${leaderEmail})`
    );

    if (!teamId || !teamName || !leaderEmail) {
      return res.status(400).json({
        success: false,
        message: "Team ID, team name, and leader email are required",
      });
    }

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Import email service
    const emailService = require("../utils/emailService");

    // Send verification email
    const emailSent = await emailService.sendVerificationMail(
      leaderEmail,
      teamName,
      team.leaderName || "Team Leader"
    );

    if (emailSent) {
      console.log(`✅ Verification email sent successfully to ${leaderEmail}`);
      res.json({
        success: true,
        message: `Verification email sent successfully to ${teamName}`,
      });
    } else {
      console.error(`❌ Failed to send verification email to ${leaderEmail}`);
      res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }
  } catch (error) {
    console.error("Send verification mail error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send verification email",
    });
  }
});

module.exports = router;
