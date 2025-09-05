const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true,
        length: 6
    },
    purpose: {
        type: String,
        required: true,
        enum: ['team_registration', 'ppt_submission', 'password_reset']
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index for auto-deletion
    }
}, {
    timestamps: true
});

// Create compound index for efficient queries
otpSchema.index({ email: 1, purpose: 1, isUsed: 1 });

module.exports = mongoose.model('OTP', otpSchema);
