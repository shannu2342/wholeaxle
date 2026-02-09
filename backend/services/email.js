const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email templates
const templates = {
    'email-verification': {
        subject: 'Welcome to Wholexale - Verify Your Email',
        html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Wholexale!</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; color: #333;">
            Thank you for joining Wholexale, India's premier B2B marketplace! 
            To get started, please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" 
               style="background: #667eea; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #666; word-break: break-all;">
            <a href="${data.verificationUrl}">${data.verificationUrl}</a>
          </p>
          
          <p style="font-size: 14px; color: #666;">
            This link will expire in 24 hours for security reasons.
          </p>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f0f0f0; font-size: 12px; color: #666;">
          <p>If you didn't create an account with Wholexale, please ignore this email.</p>
          <p>&copy; 2024 Wholexale. All rights reserved.</p>
        </div>
      </div>
    `
    },

    'password-reset': {
        subject: 'Wholexale - Password Reset Request',
        html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; color: #333;">
            We received a request to reset your password for your Wholexale account.
            Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" 
               style="background: #e74c3c; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; 
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #666; word-break: break-all;">
            <a href="${data.resetUrl}">${data.resetUrl}</a>
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Security Notice:</strong> This link will expire in 1 hour for security reasons.
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f0f0f0; font-size: 12px; color: #666;">
          <p>&copy; 2024 Wholexale. All rights reserved.</p>
        </div>
      </div>
    `
    },

    'offer-notification': {
        subject: 'New Offer - Wholexale',
        html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Offer Received</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.recipientName},</p>
          
          <p style="font-size: 16px; color: #333;">
            You have received a new offer from ${data.senderName} for ${data.productName}.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Offer Details</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Product:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Offer Price:</strong> ${data.currency} ${data.offerPrice}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Quantity:</strong> ${data.quantity} ${data.unit}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Message:</strong> ${data.message || 'No message provided'}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.offerUrl}" 
               style="background: #27ae60; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; 
                      display: inline-block; margin-right: 10px;">
              View & Respond to Offer
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f0f0f0; font-size: 12px; color: #666;">
          <p>&copy; 2024 Wholexale. All rights reserved.</p>
        </div>
      </div>
    `
    },

    'offer-response': {
        subject: 'Offer Response - Wholexale',
        html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Offer Response</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.recipientName},</p>
          
          <p style="font-size: 16px; color: #333;">
            ${data.responderName} has ${data.action} your offer for ${data.productName}.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.actionColor};">
            <h3 style="margin: 0 0 15px 0; color: #333;">Response Details</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Action:</strong> ${data.action}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Product:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Price:</strong> ${data.currency} ${data.price}</p>
            ${data.message ? `<p style="margin: 5px 0; color: #666;"><strong>Message:</strong> ${data.message}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.offerUrl}" 
               style="background: #667eea; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; 
                      display: inline-block;">
              View Offer Details
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f0f0f0; font-size: 12px; color: #666;">
          <p>&copy; 2024 Wholexale. All rights reserved.</p>
        </div>
      </div>
    `
    },

    'payment-notification': {
        subject: 'Payment Update - Wholexale',
        html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Payment Update</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.recipientName},</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.statusColor};">
            <h3 style="margin: 0 0 15px 0; color: #333;">Payment ${data.status}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${data.date}</p>
            ${data.description ? `<p style="margin: 5px 0; color: #666;"><strong>Description:</strong> ${data.description}</p>` : ''}
          </div>
          
          ${data.status === 'failed' ? `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #721c24;">
                <strong>Payment Failed:</strong> ${data.failureReason || 'Please check your payment details and try again.'}
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.retryUrl}" 
                 style="background: #e74c3c; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block;">
                Retry Payment
              </a>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl}" 
               style="background: #667eea; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; 
                      display: inline-block;">
              View Transaction
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f0f0f0; font-size: 12px; color: #666;">
          <p>&copy; 2024 Wholexale. All rights reserved.</p>
        </div>
      </div>
    `
    }
};

// Send email function
const sendEmail = async (options) => {
    try {
        const { to, subject, template, data, html, text, attachments = [] } = options;

        let emailContent = {
            from: process.env.EMAIL_FROM || 'Wholexale <noreply@wholexale.com>',
            to,
            subject,
            attachments
        };

        // Use template if provided
        if (template && templates[template]) {
            emailContent.subject = templates[template].subject;
            emailContent.html = templates[template].html(data);
        } else if (html) {
            emailContent.html = html;
        }

        if (text) {
            emailContent.text = text;
        }

        const info = await transporter.sendMail(emailContent);

        logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
        return {
            success: true,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        };

    } catch (error) {
        logger.error('Email send error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Send bulk emails
const sendBulkEmail = async (emails) => {
    const results = [];

    for (const email of emails) {
        try {
            const result = await sendEmail(email);
            results.push({
                email: email.to,
                success: result.success,
                messageId: result.messageId,
                error: result.error
            });
        } catch (error) {
            logger.error(`Bulk email error for ${email.to}:`, error);
            results.push({
                email: email.to,
                success: false,
                error: error.message
            });
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
};

// Verify transporter connection
const verifyConnection = async () => {
    try {
        await transporter.verify();
        logger.info('Email service connected successfully');
        return true;
    } catch (error) {
        logger.error('Email service connection failed:', error);
        return false;
    }
};

module.exports = {
    sendEmail,
    sendBulkEmail,
    verifyConnection,
    templates
};