require("dotenv").config();
const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const cors = require("cors");
const connectDB = require("./dbconfig/database");
const { Admin } = require("./models");
const { configureSession } = require("./middlewares/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Trust proxy for production
app.set("trust proxy", 1);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    credentials: true,
  })
);

// Session configuration
app.use(configureSession(session));

// Configure EJS and ejs-mate
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files (with proper authentication for sensitive files)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Body parser middleware
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// Global middleware for request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import routes
const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const teamRoutes = require("./routes/teams");
const uploadRoutes = require("./routes/upload");
const adminRoutes = require("./routes/admin");

// Use routes
app.use("/", indexRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate entry found",
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Create default admin on startup
const initializeApp = async () => {
  try {
    await Admin.createDefaultAdmin();
    console.log("🚀 Application initialized successfully");
  } catch (error) {
    console.error("❌ Application initialization failed:", error);
  }
};

app.listen(PORT, () => {
  console.log(`🌟 Server is running at http://localhost:${PORT}/`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🗄️  Database: ${process.env.MONGO_URI ? "Connected" : "Not configured"}`
  );

  // Initialize app after server starts
  initializeApp();
});
