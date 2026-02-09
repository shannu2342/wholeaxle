const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    // Basic Information
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },

    // Profile Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    avatar: {
        type: String,
        default: null
    },

    // Business Information
    businessName: {
        type: String,
        trim: true,
        maxlength: [100, 'Business name cannot exceed 100 characters']
    },
    businessType: {
        type: String,
        enum: ['manufacturer', 'wholesaler', 'distributor', 'retailer', 'service_provider'],
        default: 'retailer'
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
    },
    businessAddress: {
        street: String,
        city: String,
        state: String,
        country: { type: String, default: 'India' },
        pincode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },

    // Account Status
    role: {
        type: String,
        enum: ['user', 'vendor', 'admin', 'super_admin'],
        default: 'user'
    },

    // RBAC partitions (admin-web). Super admins typically have ['*'].
    partitions: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending_verification'],
        default: 'pending_verification'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },

    // Verification
    emailVerified: {
        type: Boolean,
        default: false
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    businessVerified: {
        type: Boolean,
        default: false
    },

    // Security
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Preferences
    preferences: {
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'Asia/Kolkata' },
        currency: { type: String, default: 'INR' },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true },
            chat: { type: Boolean, default: true },
            offers: { type: Boolean, default: true },
            system: { type: Boolean, default: true }
        },
        privacy: {
            showOnlineStatus: { type: Boolean, default: true },
            allowDirectMessages: { type: Boolean, default: true },
            showBusinessInfo: { type: Boolean, default: true }
        }
    },

    // Credits and Limits
    creditLimit: {
        type: Number,
        default: 0
    },
    availableCredit: {
        type: Number,
        default: 0
    },

    // Analytics
    profileViews: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },

    // Social and Engagement
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ businessName: 'text', firstName: 'text', lastName: 'text' });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update updatedAt field
userSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function () {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    // If we hit max attempts and it's not locked already, lock the account
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }

    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Method to update last login
userSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
