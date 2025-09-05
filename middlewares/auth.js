const { Admin } = require("../models");

// Check if user is authenticated admin
const requireAuth = async (req, res, next) => {
  try {
    // Check if admin session exists
    if (!req.session || !req.session.adminId) {
      // Check if it's an API request
      if (
        req.path.startsWith("/api/") ||
        req.xhr ||
        req.headers.accept?.includes("application/json")
      ) {
        return res.status(401).json({
          success: false,
          message: "Authentication required. Please login first.",
          redirect: "/admin/login",
        });
      }
      // For regular page requests, redirect to login
      return res.redirect("/admin/login");
    }

    // Verify admin exists and is active
    const admin = await Admin.findById(req.session.adminId);
    if (!admin || !admin.isActive) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });

      // Check if it's an API request
      if (
        req.path.startsWith("/api/") ||
        req.xhr ||
        req.headers.accept?.includes("application/json")
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid session. Please login again.",
          redirect: "/admin/login",
        });
      }
      // For regular page requests, redirect to login
      return res.redirect("/admin/login");
    }

    // Check if account is locked
    if (admin.isLocked) {
      // Check if it's an API request
      if (
        req.path.startsWith("/api/") ||
        req.xhr ||
        req.headers.accept?.includes("application/json")
      ) {
        return res.status(423).json({
          success: false,
          message:
            "Account is locked due to multiple failed login attempts. Please try again later.",
          lockUntil: admin.lockUntil,
        });
      }
      // For regular page requests, show error page or redirect
      return res.redirect("/admin/login?error=account_locked");
    }

    // Add admin to request object
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    // Check if it's an API request
    if (
      req.path.startsWith("/api/") ||
      req.xhr ||
      req.headers.accept?.includes("application/json")
    ) {
      return res.status(500).json({
        success: false,
        message: "Authentication verification failed",
      });
    }
    // For regular page requests, redirect to login
    return res.redirect("/admin/login?error=auth_failed");
  }
};

// Check specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Super admin has all permissions
    if (req.admin.role === "super_admin") {
      return next();
    }

    // Check specific permission
    if (!req.admin.permissions || !req.admin.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required permission: ${permission}`,
      });
    }

    next();
  };
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

// Check if admin session is valid (for page renders)
const checkAuthStatus = async (req, res, next) => {
  try {
    if (req.session && req.session.adminId) {
      const admin = await Admin.findById(req.session.adminId);
      if (admin && admin.isActive && !admin.isLocked) {
        req.admin = admin;
        req.isAuthenticated = true;
      } else {
        req.session.destroy((err) => {
          if (err) console.error("Session destroy error:", err);
        });
        req.isAuthenticated = false;
      }
    } else {
      req.isAuthenticated = false;
    }

    // Make auth status available in views
    res.locals.isAuthenticated = req.isAuthenticated;
    res.locals.admin = req.admin || null;

    next();
  } catch (error) {
    console.error("Auth status check error:", error);
    req.isAuthenticated = false;
    res.locals.isAuthenticated = false;
    res.locals.admin = null;
    next();
  }
};

// Logout middleware
const logout = (req, res, next) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          success: false,
          message: "Logout failed",
        });
      }

      res.clearCookie("connect.sid"); // Clear session cookie
      return res.json({
        success: true,
        message: "Logged out successfully",
        redirect: "/",
      });
    });
  } else {
    return res.json({
      success: true,
      message: "Already logged out",
      redirect: "/",
    });
  }
};

// Rate limiting for login attempts
const loginRateLimit = {
  attempts: new Map(),
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes

  check: (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!loginRateLimit.attempts.has(ip)) {
      loginRateLimit.attempts.set(ip, {
        count: 0,
        resetTime: now + loginRateLimit.windowMs,
      });
    }

    const attemptData = loginRateLimit.attempts.get(ip);

    // Reset if window has passed
    if (now > attemptData.resetTime) {
      attemptData.count = 0;
      attemptData.resetTime = now + loginRateLimit.windowMs;
    }

    // Check if max attempts reached
    if (attemptData.count >= loginRateLimit.maxAttempts) {
      const resetIn = Math.ceil((attemptData.resetTime - now) / 60000); // minutes
      return res.status(429).json({
        success: false,
        message: `Too many login attempts. Please try again in ${resetIn} minutes.`,
        retryAfter: attemptData.resetTime,
      });
    }

    next();
  },

  increment: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (loginRateLimit.attempts.has(ip)) {
      loginRateLimit.attempts.get(ip).count++;
    }
  },

  reset: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    loginRateLimit.attempts.delete(ip);
  },
};

// Middleware to prevent access to login page if already authenticated
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return res.redirect("/admin/dashboard");
  }
  next();
};

// Session configuration middleware
const configureSession = (session) => {
  return session({
    secret: process.env.SESSION_SECRET || "vinyas-hackathon-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict", // CSRF protection
    },
    name: "adminSessionId", // Custom session name
  });
};

module.exports = {
  requireAuth,
  requirePermission,
  requireRole,
  checkAuthStatus,
  logout,
  loginRateLimit,
  redirectIfAuthenticated,
  configureSession,
};
