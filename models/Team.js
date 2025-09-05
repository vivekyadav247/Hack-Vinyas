const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [100, "Team name cannot exceed 100 characters"],
    },
    psNumber: {
      type: String,
      required: [true, "Problem Statement Number is required"],
      trim: true,
    },
    problemStatement: {
      type: String,
      required: [true, "Problem Statement is required"],
      trim: true,
    },
    leaderName: {
      type: String,
      required: [true, "Leader name is required"],
      trim: true,
      maxlength: [50, "Leader name cannot exceed 50 characters"],
    },
    leaderEnrollment: {
      type: String,
      required: [true, "Leader enrollment number is required"],
      trim: true,
    },
    leaderEmail: {
      type: String,
      required: [true, "Leader email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    // Individual member fields (as per frontend form)
    member2Name: {
      type: String,
      trim: true,
      maxlength: [50, "Member name cannot exceed 50 characters"],
    },
    member2Enrollment: {
      type: String,
      trim: true,
    },
    member2Email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    member3Name: {
      type: String,
      trim: true,
      maxlength: [50, "Member name cannot exceed 50 characters"],
    },
    member3Enrollment: {
      type: String,
      trim: true,
    },
    member3Email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    member4Name: {
      type: String,
      trim: true,
      maxlength: [50, "Member name cannot exceed 50 characters"],
    },
    member4Enrollment: {
      type: String,
      trim: true,
    },
    member4Email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    member5Name: {
      type: String,
      trim: true,
      maxlength: [50, "Member name cannot exceed 50 characters"],
    },
    member5Enrollment: {
      type: String,
      trim: true,
    },
    member5Email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    member6Name: {
      type: String,
      trim: true,
      maxlength: [50, "Member name cannot exceed 50 characters"],
    },
    member6Enrollment: {
      type: String,
      trim: true,
    },
    member6Email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "verified", "rejected"],
      default: "pending",
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
    },
    paymentScreenshot: {
      url: String, // Cloudinary URL
      public_id: String, // Cloudinary public_id for deletion
      original_name: String, // Original filename
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    pptSubmitted: {
      type: Boolean,
      default: false,
    },
    pptSubmissionDate: {
      type: Date,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Team", teamSchema);
