const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

let affiliateProfiles = {};

router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
    const userId = req.userId?.toString();
    if (!affiliateProfiles[userId]) {
        affiliateProfiles[userId] = {
            id: `aff_${userId}`,
            userId,
            status: 'active',
            registrationDate: new Date().toISOString(),
            approvalDate: new Date().toISOString(),
            creditLimit: 50000,
            usedCredit: 0,
            availableCredit: 50000,
            commissionRate: 15,
            totalEarnings: 0,
            pendingEarnings: 0,
            monthlyEarnings: 0,
            performance: {
                ordersCompleted: 0,
                totalSales: 0,
                averageOrderValue: 0,
                conversionRate: 0,
                topProducts: [],
                commissionHistory: [],
            },
            tier: 'Silver',
            nextTier: 'Gold',
            tierProgress: 0,
            wallet: {
                balance: 0,
                pendingPayments: 0,
                totalWithdrawn: 0,
                lastWithdrawal: null,
                minimumWithdrawal: 1000,
            },
            markupPricing: {
                enabled: true,
                baseRate: 20,
                categoryOverrides: {
                    electronics: 15,
                    fashion: 25,
                    home: 18,
                },
                dynamicPricing: {
                    enabled: true,
                    competitionBased: true,
                    demandBased: true,
                }
            }
        };
    }
    res.json({ profile: affiliateProfiles[userId], affiliates: [], privateListings: [] });
}));

router.post('/register', authMiddleware, asyncHandler(async (req, res) => {
    const userId = req.userId?.toString();
    const payload = {
        id: `aff_reg_${Date.now()}`,
        userId,
        status: 'pending',
        registrationDate: new Date().toISOString(),
        documents: req.body.documents || [],
        verificationStatus: 'pending',
        expectedApprovalTime: '2-3 business days',
    };
    res.status(201).json(payload);
}));

router.post('/approve', authMiddleware, asyncHandler(async (req, res) => {
    const { affiliateId, approvedBy, creditLimit, commissionRate } = req.body;
    res.json({
        affiliateId,
        status: 'active',
        approvalDate: new Date().toISOString(),
        approvedBy,
        creditLimit,
        commissionRate,
        tier: 'Silver',
    });
}));

router.post('/markup', authMiddleware, asyncHandler(async (req, res) => {
    const { basePrice, category, affiliateId, quantity = 1 } = req.body;
    const baseRate = 20;
    const categoryAdjustment = category === 'electronics' ? -5 : category === 'fashion' ? 5 : 0;
    const volumeDiscount = quantity >= 50 ? -5 : quantity >= 10 ? -2 : 0;
    const markupRate = baseRate + categoryAdjustment + volumeDiscount;
    const markupAmount = basePrice * (markupRate / 100);
    res.json({
        basePrice,
        category,
        affiliateId,
        quantity,
        markupRate,
        markupAmount,
        finalPrice: basePrice + markupAmount,
        savingsAmount: 0,
        isDiscounted: false,
        calculations: {
            baseRate,
            categoryAdjustment,
            tierAdjustment: 0,
            volumeDiscount,
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
}));

router.post('/wallet/transaction', authMiddleware, asyncHandler(async (req, res) => {
    const { affiliateId, amount, type, description } = req.body;
    res.json({
        transactionId: `txn_${Date.now()}`,
        affiliateId,
        amount,
        type,
        description,
        balanceAfter: 0,
        timestamp: new Date().toISOString(),
        status: 'completed',
    });
}));

router.post('/settlement', authMiddleware, asyncHandler(async (req, res) => {
    const { affiliateId, period, autoProcess } = req.body;
    res.json({
        settlementId: `sett_${Date.now()}`,
        affiliateId,
        period,
        totalCommissions: 0,
        processedCommissions: 0,
        pendingCommissions: 0,
        deductions: { platformFees: 0, taxes: 0, adjustments: 0 },
        netAmount: 0,
        processedAt: new Date().toISOString(),
        status: autoProcess ? 'auto_processed' : 'pending_approval',
    });
}));

router.post('/private-listings', authMiddleware, asyncHandler(async (req, res) => {
    res.status(201).json({
        id: `private_${Date.now()}`,
        ...req.body,
        status: 'active',
        createdAt: new Date().toISOString(),
        allowedAffiliates: req.body.allowedAffiliates || [],
        visibility: 'affiliate_only',
        specialPricing: req.body.specialPricing || {},
        inventory: req.body.inventory || 0,
    });
}));

router.get('/performance', authMiddleware, asyncHandler(async (req, res) => {
    const { affiliateId, timeRange = '30d' } = req.query;
    res.json({
        affiliateId,
        timeRange,
        overview: {
            totalSales: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            conversionRate: 0,
            customerRetentionRate: 0,
            repeatPurchaseRate: 0,
        },
        salesTrend: [],
        topProducts: [],
        customerInsights: {
            newCustomers: 0,
            returningCustomers: 0,
            averageCustomerLifetime: 0,
            topCustomerSegments: [],
        },
    });
}));

module.exports = router;
