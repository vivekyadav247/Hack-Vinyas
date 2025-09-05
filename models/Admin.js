const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'moderator'],
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    permissions: {
        canViewTeams: {
            type: Boolean,
            default: true
        },
        canEditTeams: {
            type: Boolean,
            default: true
        },
        canDeleteTeams: {
            type: Boolean,
            default: false
        },
        canSendEmails: {
            type: Boolean,
            default: true
        },
        canManagePayments: {
            type: Boolean,
            default: true
        },
        canAccessReports: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

// Indexes
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
adminSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Instance method to increment login attempts
adminSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // If this is the 5th attempt, lock the account for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
        };
    }
    
    return this.updateOne(updates);
};

// Instance method to reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: {
            loginAttempts: 1,
            lockUntil: 1
        },
        $set: {
            lastLogin: new Date()
        }
    });
};

// Static method to find admin by email
adminSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to create default admin
adminSchema.statics.createDefaultAdmin = async function() {
    const adminExists = await this.findOne({ role: 'super_admin' });
    if (!adminExists) {
        const defaultAdmin = new this({
            email: process.env.ADMIN_EMAIL || 'vivekyad240706@gmail.com',
            password: process.env.ADMIN_PASSWORD || 'admin123',
            name: 'Super Admin',
            role: 'super_admin',
            permissions: {
                canViewTeams: true,
                canEditTeams: true,
                canDeleteTeams: true,
                canSendEmails: true,
                canManagePayments: true,
                canAccessReports: true
            }
        });
        await defaultAdmin.save();
        console.log('✅ Default admin created successfully');
        return defaultAdmin;
    }
    return adminExists;
};

module.exports = mongoose.model('Admin', adminSchema);
