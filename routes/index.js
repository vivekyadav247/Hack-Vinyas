const express = require("express");
const router = express.Router();
const {
  checkAuthStatus,
  requireAuth,
  redirectIfAuthenticated,
} = require("../middlewares/auth");
const { Team, PPTSubmission } = require("../models");

// Apply auth status check to all routes
router.use(checkAuthStatus);

// Home route
router.get("/", (req, res) => {
  res.render("pages/main", {
    title: "Hack Vinyas ⚡ - Unleash Innovation",
    cssFile: "main.css",
    jsFile: "main.js",
    currentPage: "main",
  });
});

// Registration route
router.get("/register", (req, res) => {
  res.render("pages/registration", {
    title: "Team Registration - Hack Vinyas",
    cssFile: "registration.css",
    jsFile: "registration.js",
    currentPage: "registration",
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
  });
});

// PPT Submission route
router.get("/ppt-submission", (req, res) => {
  res.render("pages/ppt_submission", {
    title: "PPT Submission - Hack Vinyas",
    cssFile: "ppt_submission.css",
    jsFile: "ppt_submission.js",
    currentPage: "ppt-submission",
  });
});

// Admin Login route - redirect if already authenticated
router.get("/admin/login", redirectIfAuthenticated, (req, res) => {
  res.render("pages/admin_login", {
    title: "Admin Login - Hack Vinyas",
    currentPage: "admin-login",
  });
});

// Admin Home route - NEW WORKING ROUTE
router.get("/admin/home", requireAuth, async (req, res) => {
  try {
    // Get dashboard statistics with proper Team model usage
    const [totalTeams, paidTeams, pendingTeams, recentTeams] =
      await Promise.all([
        Team.countDocuments(),
        Team.countDocuments({ paymentStatus: "paid" }),
        Team.countDocuments({ paymentStatus: "pending" }),
        Team.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select("teamName leaderName leaderEmail paymentStatus createdAt")
          .lean(),
      ]);

    const dashboardData = {
      stats: {
        totalTeams,
        paidTeams,
        pendingTeams,
        totalRevenue: paidTeams * 600, // Updated to ₹600 per team
      },
      recentTeams: recentTeams.map((team) => ({
        ...team,
        registrationDate: team.createdAt,
      })),
    };

    res.render("pages/admin_home", {
      title: "Admin Home - Hack Vinyas",
      currentPage: "admin-home",
      dashboardData,
    });
  } catch (error) {
    console.error("Admin Home data fetch error:", error);
    res.render("pages/admin_home", {
      title: "Admin Home - Hack Vinyas",
      currentPage: "admin-home",
      dashboardData: {
        stats: {
          totalTeams: 0,
          paidTeams: 0,
          pendingTeams: 0,
          totalRevenue: 0,
        },
        recentTeams: [],
      },
    });
  }
});

// Admin Dashboard route - redirect to admin home
router.get("/admin/dashboard", requireAuth, (req, res) => {
  res.redirect("/admin/home");
});

// API Routes for real-time dashboard data
router.get("/api/admin/stats", requireAuth, async (req, res) => {
  try {
    const [totalTeams, verifiedPayments, totalPPTSubmissions] =
      await Promise.all([
        Team.countDocuments(),
        Team.countDocuments({ paymentStatus: { $in: ["paid", "verified"] } }),
        PPTSubmission.countDocuments(),
      ]);

    const pendingPPT = totalTeams - totalPPTSubmissions;

    // Calculate total participants by counting all team members
    const teams = await Team.find().lean();
    const totalParticipants = teams.reduce((total, team) => {
      let memberCount = 1; // Leader
      if (team.member2Name) memberCount++;
      if (team.member3Name) memberCount++;
      if (team.member4Name) memberCount++;
      return total + memberCount;
    }, 0);

    res.json({
      totalTeams,
      totalParticipants,
      verifiedPayments,
      pendingPPT,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({
      totalTeams: 0,
      totalParticipants: 0,
      verifiedPayments: 0,
      pendingPPT: 0,
    });
  }
});

router.get("/api/admin/teams", requireAuth, async (req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: -1 }).lean();

    // Check PPT submissions for each team
    const teamsWithPPT = await Promise.all(
      teams.map(async (team) => {
        const pptSubmission = await PPTSubmission.findOne({ teamId: team._id });
        return {
          ...team,
          hasPPTSubmission: !!pptSubmission,
          pptSubmitted: !!pptSubmission,
        };
      })
    );

    res.json(teamsWithPPT);
  } catch (error) {
    console.error("Teams fetch error:", error);
    res.status(500).json([]);
  }
});

router.get("/api/admin/team/:id", requireAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).lean();

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Team fetch error:", error);
    res.status(500).json({ error: "Failed to fetch team details" });
  }
});

router.post("/api/admin/team/:id/payment", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["paid", "pending", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const team = await Team.findByIdAndUpdate(
      req.params.id,
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
      message: `Payment status updated to ${status}`,
      data: team,
    });
  } catch (error) {
    console.error("Payment status update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
});

router.delete("/api/admin/team/:id", requireAuth, async (req, res) => {
  try {
    const teamId = req.params.id;

    // Find team first to get details for logging
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Delete team
    await Team.findByIdAndDelete(teamId);

    console.log(`Team deleted by admin: ${team.teamName} (ID: ${teamId})`);

    res.json({
      message: `Team "${team.teamName}" has been permanently deleted`,
      deletedTeam: {
        id: teamId,
        name: team.teamName,
        leader: team.leaderName,
      },
    });
  } catch (error) {
    console.error("Team deletion error:", error);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

// Get team PPT file
router.get("/api/admin/team/:id/ppt", requireAuth, async (req, res) => {
  try {
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Find PPT submission for this team
    const pptSubmission = await PPTSubmission.findOne({ teamId: teamId });
    if (!pptSubmission) {
      return res.status(404).json({
        success: false,
        message: "PPT file not found",
      });
    }

    res.json({
      success: true,
      pptFile: {
        originalName: pptSubmission.pptFile.originalName,
        path: pptSubmission.pptFile.path,
        size: pptSubmission.pptFile.size,
        mimeType: pptSubmission.pptFile.mimeType,
        uploadDate: pptSubmission.submissionDate,
      },
    });
  } catch (error) {
    console.error("PPT file retrieval error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve PPT file",
    });
  }
});

// Admin Teams route - require authentication
router.get("/admin/teams", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search } = req.query;

    // Build filter query
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { teamName: { $regex: search, $options: "i" } },
        { leaderName: { $regex: search, $options: "i" } },
        { leaderEmail: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [teams, total] = await Promise.all([
      Team.find(filter)
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Team.countDocuments(filter),
    ]);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalTeams: total,
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1,
      limit: limitNum,
    };

    res.render("pages/admin_teams", {
      title: "Team Management - Hack Vinyas",
      currentPage: "admin-teams",
      teams,
      pagination,
      filters: { status, paymentStatus, search },
    });
  } catch (error) {
    console.error("Teams page error:", error);
    res.status(500).render("error", {
      title: "Error - Hack Vinyas",
      message: "Failed to load teams data",
    });
  }
});

module.exports = router;
