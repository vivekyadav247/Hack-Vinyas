const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin schema definition
const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
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
        canViewTeams: { type: Boolean, default: true },
        canEditTeams: { type: Boolean, default: false },
        canDeleteTeams: { type: Boolean, default: false },
        canSendEmails: { type: Boolean, default: false },
        canManagePayments: { type: Boolean, default: false },
        canAccessReports: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete existing admin with this email
        await Admin.deleteMany({ email: 'vivekyad240706@gmail.com' });
        console.log('Cleared existing admin entries');

        // Create new admin
        const admin = new Admin({
            email: 'vivekyad240706@gmail.com',
            password: process.env.ADMIN_PASSWORD || 'Vinyas@2K25131107',
            name: 'Vivek Yadav',
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

        await admin.save();
        console.log('✅ Admin created successfully');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Password: Set via ADMIN_PASSWORD environment variable');
        console.log('👑 Role:', admin.role);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
