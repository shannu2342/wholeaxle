const { DataTypes } = require('sequelize');

let AuthUserModel = null;

const initAuthUserModel = (sequelize) => {
    if (AuthUserModel) return AuthUserModel;

    AuthUserModel = sequelize.define('AuthUser', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING(191),
            allowNull: false,
            unique: true
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'password_hash'
        },
        firstName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'first_name'
        },
        lastName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'last_name'
        },
        phone: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        avatar: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        businessName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'business_name'
        },
        businessType: {
            type: DataTypes.ENUM('manufacturer', 'wholesaler', 'distributor', 'retailer', 'service_provider'),
            allowNull: true,
            field: 'business_type'
        },
        gstNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'gst_number'
        },
        businessAddress: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'business_address'
        },
        role: {
            type: DataTypes.ENUM('user', 'vendor', 'admin', 'super_admin'),
            allowNull: false,
            defaultValue: 'user'
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_verification'),
            allowNull: false,
            defaultValue: 'pending_verification'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_active'
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_verified'
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'email_verified'
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_login'
        },
        loginAttempts: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            field: 'login_attempts'
        },
        lockUntil: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'lock_until'
        },
        passwordResetToken: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'password_reset_token'
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'password_reset_expires'
        },
        emailVerificationToken: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'email_verification_token'
        },
        emailVerificationExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'email_verification_expires'
        },
        partitions: {
            type: DataTypes.JSON,
            allowNull: true
        },
        preferences: {
            type: DataTypes.JSON,
            allowNull: true
        },
        creditLimit: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'credit_limit'
        },
        availableCredit: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'available_credit'
        }
    }, {
        tableName: 'auth_users',
        underscored: true,
        timestamps: true,
        indexes: [
            { unique: true, fields: ['email'] },
            { fields: ['role'] },
            { fields: ['status'] },
            { fields: ['email_verification_token'] },
            { fields: ['password_reset_token'] }
        ]
    });

    return AuthUserModel;
};

const getAuthUserModel = () => {
    if (!AuthUserModel) {
        throw new Error('AuthUser model not initialized');
    }
    return AuthUserModel;
};

module.exports = {
    initAuthUserModel,
    getAuthUserModel
};
