const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const OTP = require("../models/OTP");
const PPTSubmission = require("../models/PPTSubmission");
const emailService = require("../utils/emailService");
const { uploadMiddleware } = require("../middlewares/upload");
const { verifyRecaptchaMiddleware } = require("../utils/recaptcha");

// Route 1: GET - Render registration form
router.get("/register", (req, res) => {
  try {
    res.render("pages/registration", {
      title: "Team Registration",
      error: null,
      success: null,
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
    });
  } catch (error) {
    console.error("Registration page render error:", error);
    res.status(500).send("Server Error");
  }
});

// Route 2: POST - Complete registration with OTP and team registration
router.post(
  "/register",
  uploadMiddleware.uploadPaymentScreenshot,
  async (req, res) => {
    try {
      console.log("Registration request:", req.body);

      const { action } = req.body;

      // Handle different actions in one POST route
      if (action === "send_otp") {
        // OTP SENDING LOGIC
        const { email, name } = req.body;

        console.log("OTP request for:", { email, name });

        // Validation
        if (!email || !name) {
          return res.status(400).json({
            success: false,
            message: "Email and name are required",
          });
        }

        // Check if email already exists as team leader
        const existingLeader = await Team.findOne({
          leaderEmail: email.toLowerCase(),
        });
        if (existingLeader) {
          return res.status(400).json({
            success: false,
            message: "This email is already registered as team leader",
          });
        }

        // Check if email exists as any team member
        const existingMember = await Team.findOne({
          $or: [
            { member2Email: email.toLowerCase() },
            { member3Email: email.toLowerCase() },
            { member4Email: email.toLowerCase() },
            { member5Email: email.toLowerCase() },
            { member6Email: email.toLowerCase() },
          ],
        });

        if (existingMember) {
          return res.status(400).json({
            success: false,
            message: "This email is already registered as team member",
          });
        }

        // Generate and send OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to database
        const otpRecord = new OTP({
          email: email.toLowerCase(),
          otp: otpCode,
          purpose: "team_registration",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });
        await otpRecord.save();

        // Send email
        const emailSent = await emailService.sendOTP(
          email,
          otpCode,
          "team_registration",
          name
        );

        if (emailSent) {
          console.log("OTP sent successfully to:", email);
          return res.json({
            success: true,
            message: `OTP sent to ${email}`,
            expiresIn: "10 minutes",
          });
        } else {
          throw new Error("Failed to send email");
        }
      } else if (action === "verify_otp") {
        // OTP VERIFICATION LOGIC
        const { email, otp } = req.body;

        console.log("OTP verification for:", { email, otp });

        // Validation
        if (!email || !otp) {
          return res.status(400).json({
            success: false,
            message: "Email and OTP are required",
          });
        }

        // Find valid OTP
        const otpRecord = await OTP.findOne({
          email: email.toLowerCase(),
          otp: otp,
          purpose: "team_registration",
          expiresAt: { $gt: new Date() },
          isUsed: false,
        });

        if (!otpRecord) {
          return res.status(400).json({
            success: false,
            message: "Invalid or expired OTP",
          });
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();

        console.log("OTP verified successfully for:", email);

        return res.json({
          success: true,
          message: "Email verified successfully",
        });
      } else if (action === "register_team") {
        // TEAM REGISTRATION LOGIC

        // First verify reCAPTCHA
        const recaptchaToken =
          req.body.recaptchaToken || req.body["g-recaptcha-response"];
        if (!recaptchaToken) {
          return res.status(400).json({
            success: false,
            message: "Please complete the reCAPTCHA verification.",
          });
        }

        // Verify reCAPTCHA
        const { verifyRecaptcha } = require("../utils/recaptcha");
        const recaptchaResult = await verifyRecaptcha(recaptchaToken, req.ip);

        if (!recaptchaResult.success) {
          return res.status(400).json({
            success: false,
            message: "Please complete the reCAPTCHA verification.",
            error: recaptchaResult.error,
          });
        }

        console.log("✅ reCAPTCHA verified for team registration");

        // Extract and validate required fields
        const {
          teamName,
          psNumber,
          problemStatement,
          leaderName,
          leaderEnrollment,
          leaderEmail,
          member2Name,
          member2Enrollment,
          member2Email,
          member3Name,
          member3Enrollment,
          member3Email,
          member4Name,
          member4Enrollment,
          member4Email,
          member5Name,
          member5Enrollment,
          member5Email,
          member6Name,
          member6Enrollment,
          member6Email,
          transactionId,
        } = req.body;

        // Required field validation
        if (
          !teamName ||
          !psNumber ||
          !problemStatement ||
          !leaderName ||
          !leaderEnrollment ||
          !leaderEmail
        ) {
          return res.status(400).json({
            success: false,
            message: "All team leader details are required",
          });
        }

        // Payment validation - Both transaction ID and screenshot are required
        if (!transactionId || !transactionId.trim()) {
          return res.status(400).json({
            success: false,
            message: "Transaction ID is required for payment verification",
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "Payment screenshot is required for payment verification",
          });
        }

        // Validate file type
        if (!req.file.mimetype.startsWith("image/")) {
          return res.status(400).json({
            success: false,
            message:
              "Payment screenshot must be an image file (JPG, PNG, JPEG)",
          });
        }

        // Minimum team size validation (leader + 5 members = 6 total)
        if (
          !member2Name ||
          !member2Enrollment ||
          !member3Name ||
          !member3Enrollment ||
          !member4Name ||
          !member4Enrollment ||
          !member5Name ||
          !member5Enrollment ||
          !member6Name ||
          !member6Enrollment
        ) {
          return res.status(400).json({
            success: false,
            message:
              "All 6 team members are required (Leader + 5 additional members). Please fill all member details.",
          });
        }

        // Check if leader email is verified (OTP used)
        const verifiedOTP = await OTP.findOne({
          email: leaderEmail.toLowerCase(),
          purpose: "team_registration",
          isUsed: true,
        }).sort({ createdAt: -1 });

        if (!verifiedOTP) {
          return res.status(400).json({
            success: false,
            message: "Please verify your email first",
          });
        }

        // Check for duplicate emails in current submission
        const allEmails = [leaderEmail];
        if (member2Email && member2Email.trim())
          allEmails.push(member2Email.trim());
        if (member3Email && member3Email.trim())
          allEmails.push(member3Email.trim());
        if (member4Email && member4Email.trim())
          allEmails.push(member4Email.trim());
        if (member5Email && member5Email.trim())
          allEmails.push(member5Email.trim());
        if (member6Email && member6Email.trim())
          allEmails.push(member6Email.trim());

        console.log("📧 All emails to check:", allEmails); // Debug log

        // Remove empty emails and convert to lowercase
        const validEmails = allEmails
          .filter((email) => email && email.trim())
          .map((email) => email.toLowerCase());
        const uniqueEmails = new Set(validEmails);

        console.log("📧 Valid emails:", validEmails); // Debug log
        console.log("📧 Unique emails:", Array.from(uniqueEmails)); // Debug log

        if (uniqueEmails.size !== validEmails.length) {
          return res.status(400).json({
            success: false,
            message: "Duplicate email addresses found in team members",
          });
        }

        // Check if any email already exists in database
        for (const email of validEmails) {
          console.log(`🔍 Checking email in database: ${email}`); // Debug log

          const existingTeam = await Team.findOne({
            $or: [
              { leaderEmail: email },
              { member2Email: email },
              { member3Email: email },
              { member4Email: email },
              { member5Email: email },
              { member6Email: email },
            ],
          });

          if (existingTeam) {
            console.log(
              `❌ Email ${email} already exists in team: ${existingTeam.teamName}`
            ); // Debug log
            return res.status(400).json({
              success: false,
              message: `Email ${email} is already registered with team "${existingTeam.teamName}"`,
            });
          }
        }

        // Check for duplicate enrollment numbers
        const allEnrollments = [leaderEnrollment];
        if (member2Enrollment) allEnrollments.push(member2Enrollment);
        if (member3Enrollment) allEnrollments.push(member3Enrollment);
        if (member4Enrollment) allEnrollments.push(member4Enrollment);
        if (member5Enrollment) allEnrollments.push(member5Enrollment);
        if (member6Enrollment) allEnrollments.push(member6Enrollment);

        const uniqueEnrollments = new Set(allEnrollments);
        if (uniqueEnrollments.size !== allEnrollments.length) {
          return res.status(400).json({
            success: false,
            message: "Duplicate enrollment numbers found in team",
          });
        }

        // Check if any enrollment already exists in database
        for (const enrollment of allEnrollments) {
          if (!enrollment) continue;

          const existingTeam = await Team.findOne({
            $or: [
              { leaderEnrollment: enrollment },
              { member2Enrollment: enrollment },
              { member3Enrollment: enrollment },
              { member4Enrollment: enrollment },
              { member5Enrollment: enrollment },
              { member6Enrollment: enrollment },
            ],
          });

          if (existingTeam) {
            return res.status(400).json({
              success: false,
              message: `Enrollment number ${enrollment} is already registered`,
            });
          }
        }

        // Create team data object
        const teamData = {
          teamName: teamName.trim(),
          psNumber: psNumber.trim(),
          problemStatement: problemStatement.trim(),
          leaderName: leaderName.trim(),
          leaderEnrollment: leaderEnrollment.trim(),
          leaderEmail: leaderEmail.toLowerCase().trim(),
        };

        // Add members if provided
        if (member2Name && member2Enrollment) {
          teamData.member2Name = member2Name.trim();
          teamData.member2Enrollment = member2Enrollment.trim();
          if (member2Email)
            teamData.member2Email = member2Email.toLowerCase().trim();
        }

        if (member3Name && member3Enrollment) {
          teamData.member3Name = member3Name.trim();
          teamData.member3Enrollment = member3Enrollment.trim();
          if (member3Email)
            teamData.member3Email = member3Email.toLowerCase().trim();
        }

        if (member4Name && member4Enrollment) {
          teamData.member4Name = member4Name.trim();
          teamData.member4Enrollment = member4Enrollment.trim();
          if (member4Email)
            teamData.member4Email = member4Email.toLowerCase().trim();
        }

        if (member5Name && member5Enrollment) {
          teamData.member5Name = member5Name.trim();
          teamData.member5Enrollment = member5Enrollment.trim();
          if (member5Email)
            teamData.member5Email = member5Email.toLowerCase().trim();
        }

        if (member6Name && member6Enrollment) {
          teamData.member6Name = member6Name.trim();
          teamData.member6Enrollment = member6Enrollment.trim();
          if (member6Email)
            teamData.member6Email = member6Email.toLowerCase().trim();
        }

        // Add transaction ID if provided
        if (transactionId) {
          teamData.transactionId = transactionId.trim();
          teamData.paymentStatus = "paid";
        }

        // Add payment screenshot if uploaded
        if (req.file) {
          teamData.paymentScreenshot = {
            url: req.file.path, // Cloudinary URL
            public_id: req.file.filename, // Cloudinary public_id
            original_name: req.file.originalname,
          };
        }

        // Save team to database
        const team = new Team(teamData);
        await team.save();

        console.log("Team registered successfully:", team._id);

        // Calculate team size
        let teamSize = 1; // Leader
        if (member2Name) teamSize++;
        if (member3Name) teamSize++;
        if (member4Name) teamSize++;
        if (member5Name) teamSize++;
        if (member6Name) teamSize++;

        return res.json({
          success: true,
          message: "Team registered successfully!",
          teamId: team._id,
          teamSize: teamSize,
          paymentStatus: team.paymentStatus,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid action",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed. Please try again.",
      });
    }
  }
);

// Check if email exists route
router.post("/check-email-exists", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if team exists with this leader email
    const team = await Team.findOne({ leaderEmail: email.toLowerCase() });

    if (team) {
      res.json({
        success: true,
        userExists: true,
        teamName: team.teamName,
        message: `Team "${team.teamName}" found`,
      });
    } else {
      res.json({
        success: false,
        userExists: false,
        message:
          "No team found with this email address. Please register first.",
      });
    }
  } catch (error) {
    console.error("Email check error:", error);
    res.status(500).json({
      success: false,
      userExists: false,
      message: "Error checking email. Please try again.",
    });
  }
});

// PPT Submission OTP Route
router.post("/send-ppt-submission-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if team exists with this leader email
    const team = await Team.findOne({ leaderEmail: email.toLowerCase() });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No team found with this email address",
      });
    }

    // Check if PPT already submitted
    const existingSubmission = await PPTSubmission.findOne({
      teamId: team._id,
    });

    if (existingSubmission) {
      return res.status(200).json({
        success: false,
        message: "PPT already submitted for this team",
        status: "already_submitted",
        teamName: team.teamName,
        submission: {
          fileName: existingSubmission.pptFile.originalName,
          submissionDate: existingSubmission.submissionDate,
          status: existingSubmission.status,
        },
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp,
      purpose: "ppt_submission",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP email
    const emailSent = await emailService.sendOTP(
      email,
      otp,
      team.teamName,
      "PPT Submission"
    );

    if (emailSent) {
      res.json({
        success: true,
        message: `OTP sent successfully to ${email}`,
        teamName: team.teamName,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
    }
  } catch (error) {
    console.error("PPT OTP sending error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
});

// Verify PPT Submission OTP Route
router.post("/verify-ppt-submission-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp: otp,
      purpose: "ppt_submission",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Get team info
    const team = await Team.findOne({ leaderEmail: email.toLowerCase() });

    res.json({
      success: true,
      message: "OTP verified successfully",
      teamId: team._id,
      teamName: team.teamName,
    });
  } catch (error) {
    console.error("PPT OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "OTP verification failed. Please try again.",
    });
  }
});

module.exports = router;
