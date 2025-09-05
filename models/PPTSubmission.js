const mongoose = require("mongoose");

const pptSubmissionSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team ID is required"],
    },
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
    },
    leaderEmail: {
      type: String,
      required: [true, "Leader email is required"],
      lowercase: true,
      trim: true,
    },
    pptFile: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
      originalName: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      mimeType: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return [
              "application/vnd.ms-powerpoint",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "application/pdf",
            ].includes(v);
          },
          message:
            "Invalid file type. Only PPT, PPTX, and PDF files are allowed.",
        },
      },
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "needs_revision",
      ],
      default: "submitted",
    },
    reviewComments: {
      type: String,
      maxlength: [1000, "Review comments cannot exceed 1000 characters"],
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewDate: {
      type: Date,
      default: null,
    },
    score: {
      type: Number,
      min: [0, "Score cannot be negative"],
      max: [100, "Score cannot exceed 100"],
      default: null,
    },
    metadata: {
      ipAddress: {
        type: String,
        default: null,
      },
      userAgent: {
        type: String,
        default: null,
      },
      submissionDeadline: {
        type: Date,
        default: function () {
          // Set deadline to 7 days from submission date
          return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        },
      },
    },
    isLateSubmission: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
pptSubmissionSchema.index({ teamId: 1 });
pptSubmissionSchema.index({ leaderEmail: 1 });
pptSubmissionSchema.index({ status: 1 });
pptSubmissionSchema.index({ submissionDate: -1 });
pptSubmissionSchema.index({ teamName: "text" }); // Text search index

// Compound index for efficient queries
pptSubmissionSchema.index({ teamId: 1, version: -1 });

// Virtual for file size in MB
pptSubmissionSchema.virtual("fileSizeMB").get(function () {
  return (this.pptFile.size / (1024 * 1024)).toFixed(2);
});

// Virtual for days since submission
pptSubmissionSchema.virtual("daysSinceSubmission").get(function () {
  const diffTime = Math.abs(new Date() - this.submissionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for submission status badge color
pptSubmissionSchema.virtual("statusColor").get(function () {
  const colors = {
    submitted: "bg-blue-100 text-blue-800",
    under_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    needs_revision: "bg-orange-100 text-orange-800",
  };
  return colors[this.status] || "bg-gray-100 text-gray-800";
});

// Pre-save middleware to handle versioning
pptSubmissionSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Check if this is a resubmission (same team)
    const existingSubmission = await this.constructor
      .findOne({ teamId: this.teamId })
      .sort({ version: -1 });

    if (existingSubmission) {
      this.version = existingSubmission.version + 1;
    }

    // Check if submission is late
    const submissionDeadline = this.metadata.submissionDeadline;
    if (submissionDeadline && this.submissionDate > submissionDeadline) {
      this.isLateSubmission = true;
    }
  }
  next();
});

// Static method to get submissions by status
pptSubmissionSchema.statics.getByStatus = function (status) {
  return this.find({ status })
    .populate("teamId", "teamName leaderName leaderEmail paymentStatus")
    .populate("reviewedBy", "name email")
    .sort({ submissionDate: -1 });
};

// Static method to get latest submission for a team
pptSubmissionSchema.statics.getLatestByTeam = function (teamId) {
  return this.findOne({ teamId })
    .sort({ version: -1 })
    .populate("teamId", "teamName leaderName leaderEmail")
    .populate("reviewedBy", "name email");
};

// Static method to get submission statistics
pptSubmissionSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalSubmissions = await this.countDocuments();
  const lateSubmissions = await this.countDocuments({ isLateSubmission: true });
  const avgScore = await this.aggregate([
    { $match: { score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: "$score" } } },
  ]);

  return {
    total: totalSubmissions,
    late: lateSubmissions,
    byStatus: stats,
    averageScore: avgScore.length > 0 ? avgScore[0].avgScore.toFixed(2) : null,
  };
};

// Instance method to update review
pptSubmissionSchema.methods.updateReview = function (
  status,
  comments,
  score,
  reviewerId
) {
  this.status = status;
  this.reviewComments = comments || "";
  this.score = score || null;
  this.reviewedBy = reviewerId;
  this.reviewDate = new Date();
  return this.save();
};

// Instance method to check if file exists
pptSubmissionSchema.methods.fileExists = function () {
  const fs = require("fs");
  const path = require("path");
  return fs.existsSync(path.resolve(this.pptFile.path));
};

module.exports = mongoose.model("PPTSubmission", pptSubmissionSchema);
