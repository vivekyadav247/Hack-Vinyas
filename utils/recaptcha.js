const axios = require("axios");

// reCAPTCHA v2 Checkbox configuration
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/**
 * Verify reCAPTCHA v2 checkbox response with Google's API
 * @param {string} token - The reCAPTCHA response token from frontend checkbox
 * @param {string} remoteip - Client IP address (optional)
 * @returns {Promise<Object>} Verification result
 */
async function verifyRecaptcha(token, remoteip = null) {
  try {
    if (!token) {
      return {
        success: false,
        error: "No reCAPTCHA response provided",
      };
    }

    // Make request to Google's verification API
    const response = await axios.post(
      RECAPTCHA_VERIFY_URL,
      {
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
        ...(remoteip && { remoteip }),
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = response.data;

    return {
      success: data.success,
      challenge_ts: data.challenge_ts || null,
      hostname: data.hostname || null,
      "error-codes": data["error-codes"] || [],
    };
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return {
      success: false,
      error: "reCAPTCHA verification failed due to server error",
    };
  }
}

/**
 * Middleware to verify reCAPTCHA v2 checkbox response for routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function verifyRecaptchaMiddleware(req, res, next) {
  try {
    const token = req.body.recaptchaToken || req.body["g-recaptcha-response"];
    const clientIP =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    const verification = await verifyRecaptcha(token, clientIP);

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: "Please complete the reCAPTCHA verification.",
        error: verification.error || "Invalid reCAPTCHA",
        errorCodes: verification["error-codes"],
      });
    }

    // Store verification result in request for logging
    req.recaptchaVerification = verification;
    next();
  } catch (error) {
    console.error("reCAPTCHA middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during reCAPTCHA verification",
    });
  }
}

/**
 * Get the site key for frontend use
 * @returns {string} reCAPTCHA site key
 */
function getSiteKey() {
  return RECAPTCHA_SITE_KEY;
}

module.exports = {
  verifyRecaptcha,
  verifyRecaptchaMiddleware,
  getSiteKey,
};
