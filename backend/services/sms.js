const twilio = require('twilio');
const logger = require('../utils/logger');

// Initialize Twilio client lazily and safely so missing SMS creds don't crash backend startup.
const hasTwilioConfig = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
);
const client = hasTwilioConfig
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const smsProviderUnavailable = (to = null) => ({
    success: false,
    error: 'SMS provider is not configured',
    to
});

// SMS templates
const templates = {
    'otp': {
        message: 'Your Wholexale verification code is {code}. This code will expire in 10 minutes. Do not share this code with anyone.',
        type: 'otp'
    },

    'welcome': {
        message: 'Welcome to Wholexale! Your account has been created successfully. Start exploring B2B opportunities today. Download our app: {appLink}',
        type: 'notification'
    },

    'offer-notification': {
        message: 'New offer received on Wholexale from {senderName} for {productName}. Amount: {currency} {amount}. Check your app for details.',
        type: 'notification'
    },

    'offer-response': {
        message: 'Your offer for {productName} has been {action} by {responderName}. Check the app for full details.',
        type: 'notification'
    },

    'payment-success': {
        message: 'Payment of {currency} {amount} processed successfully on Wholexale. Transaction ID: {transactionId}. Thank you!',
        type: 'transaction'
    },

    'payment-failed': {
        message: 'Payment of {currency} {amount} failed on Wholexale. Reason: {reason}. Please try again or contact support.',
        type: 'transaction'
    },

    'credit-added': {
        message: '{currency} {amount} has been added to your Wholexale account. AvailableBalance}.',
        type: ' balance: {availabletransaction'
    },

    'password-reset': {
        message: 'Your Wholexale password reset code is {code}. This code will expire in 10 minutes. If you didn\'t request this, ignore this message.',
        type: 'security'
    },

    'login-alert': {
        message: 'New login to your Wholexale account from {device} at {location}. If this wasn\'t you, please secure your account immediately.',
        type: 'security'
    },

    'order-update': {
        message: 'Order {orderId} status updated: {status}. Track your order in the Wholexale app.',
        type: 'transaction'
    }
};

// Send SMS function
const sendSMS = async (to, template, data = {}) => {
    try {
        if (!client || !fromNumber) {
            logger.warn('SMS send skipped: Twilio is not configured.');
            return smsProviderUnavailable(to);
        }

        // Format phone number
        const formattedPhone = formatPhoneNumber(to);

        // Get template message
        let message = templates[template]?.message || data.message;

        // Replace placeholders in message
        if (message && data) {
            Object.keys(data).forEach(key => {
                const placeholder = `{${key}}`;
                message = message.replace(new RegExp(placeholder, 'g'), data[key]);
            });
        }

        // Send SMS via Twilio
        const result = await client.messages.create({
            body: message,
            from: fromNumber,
            to: formattedPhone
        });

        logger.info(`SMS sent successfully to ${to}: ${result.sid}`);

        return {
            success: true,
            messageId: result.sid,
            status: result.status,
            to: formattedPhone,
            message
        };

    } catch (error) {
        logger.error(`SMS send error to ${to}:`, error);
        return {
            success: false,
            error: error.message,
            code: error.code,
            to
        };
    }
};

// Send OTP SMS
const sendOTP = async (to, otp) => {
    return sendSMS(to, 'otp', { code: otp });
};

// Send bulk SMS
const sendBulkSMS = async (smsList) => {
    const results = [];

    for (const sms of smsList) {
        try {
            const result = await sendSMS(sms.to, sms.template, sms.data);
            results.push({
                to: sms.to,
                success: result.success,
                messageId: result.messageId,
                error: result.error
            });
        } catch (error) {
            logger.error(`Bulk SMS error for ${sms.to}:`, error);
            results.push({
                to: sms.to,
                success: false,
                error: error.message
            });
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
};

// Send SMS with custom message
const sendCustomSMS = async (to, message) => {
    try {
        if (!client || !fromNumber) {
            logger.warn('Custom SMS skipped: Twilio is not configured.');
            return smsProviderUnavailable(to);
        }

        const formattedPhone = formatPhoneNumber(to);

        const result = await client.messages.create({
            body: message,
            from: fromNumber,
            to: formattedPhone
        });

        logger.info(`Custom SMS sent successfully to ${to}: ${result.sid}`);

        return {
            success: true,
            messageId: result.sid,
            status: result.status,
            to: formattedPhone
        };

    } catch (error) {
        logger.error(`Custom SMS send error to ${to}:`, error);
        return {
            success: false,
            error: error.message,
            code: error.code,
            to
        };
    }
};

// Get SMS status
const getSMSStatus = async (messageId) => {
    try {
        if (!client) {
            return {
                success: false,
                error: 'SMS provider is not configured'
            };
        }

        const message = await client.messages(messageId).fetch();

        return {
            success: true,
            status: message.status,
            errorCode: message.errorCode,
            errorMessage: message.errorMessage,
            dateCreated: message.dateCreated,
            dateSent: message.dateSent,
            dateUpdated: message.dateUpdated
        };

    } catch (error) {
        logger.error(`Get SMS status error for ${messageId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Send verification SMS
const sendVerificationSMS = async (to, verificationCode) => {
    const message = `Your Wholexale verification code is ${verificationCode}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    return sendCustomSMS(to, message);
};

// Send password reset SMS
const sendPasswordResetSMS = async (to, resetCode) => {
    const message = `Your Wholexale password reset code is ${resetCode}. This code will expire in 10 minutes. If you didn't request this, ignore this message.`;
    return sendCustomSMS(to, message);
};

// Send notification SMS
const sendNotificationSMS = async (to, type, data) => {
    const template = templates[type];
    if (!template) {
        throw new Error(`Unknown SMS template: ${type}`);
    }

    return sendSMS(to, type, data);
};

// Format phone number
const formatPhoneNumber = (phone) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Handle Indian numbers
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+${cleaned}`;
    } else if (cleaned.startsWith('+')) {
        return cleaned;
    } else {
        // Assume it's already in international format
        return `+${cleaned}`;
    }
};

// Validate phone number
const validatePhoneNumber = (phone) => {
    try {
        const formatted = formatPhoneNumber(phone);
        // Basic validation for Indian phone numbers
        const phoneRegex = /^\+91[6-9]\d{9}$/;
        return phoneRegex.test(formatted);
    } catch (error) {
        return false;
    }
};

// Get SMS delivery report
const getDeliveryReport = async (messageId) => {
    try {
        const message = await client.messages(messageId).fetch();

        return {
            messageId,
            status: message.status,
            direction: message.direction,
            from: message.from,
            to: message.to,
            body: message.body,
            dateCreated: message.dateCreated,
            dateSent: message.dateSent,
            dateUpdated: message.dateUpdated,
            price: message.price,
            priceUnit: message.priceUnit,
            uri: message.uri,
            subresourceUris: message.subresourceUris
        };

    } catch (error) {
        logger.error(`Get delivery report error for ${messageId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Send promotional SMS
const sendPromotionalSMS = async (to, message, campaignId) => {
    try {
        const formattedPhone = formatPhoneNumber(to);

        const result = await client.messages.create({
            body: message,
            from: fromNumber,
            to: formattedPhone,
            // Add campaign metadata
            statusCallback: `${process.env.BASE_URL}/api/webhooks/sms-status?campaign=${campaignId}`
        });

        logger.info(`Promotional SMS sent to ${to}: ${result.sid}`);

        return {
            success: true,
            messageId: result.sid,
            campaignId,
            to: formattedPhone
        };

    } catch (error) {
        logger.error(`Promotional SMS error to ${to}:`, error);
        return {
            success: false,
            error: error.message,
            campaignId,
            to
        };
    }
};

// Verify Twilio connection
const verifyConnection = async () => {
    try {
        const account = await client.api.accounts.list({ limit: 1 });
        logger.info('SMS service (Twilio) connected successfully');
        return true;
    } catch (error) {
        logger.error('SMS service (Twilio) connection failed:', error);
        return false;
    }
};

module.exports = {
    sendSMS,
    sendOTP,
    sendBulkSMS,
    sendCustomSMS,
    sendVerificationSMS,
    sendPasswordResetSMS,
    sendNotificationSMS,
    sendPromotionalSMS,
    getSMSStatus,
    getDeliveryReport,
    formatPhoneNumber,
    validatePhoneNumber,
    verifyConnection,
    templates
};
