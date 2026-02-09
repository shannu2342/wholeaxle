const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { CreditLedger, CreditLimit, Payment } = require('../models/Finance');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const Settlement = require('../models/Settlement');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/finance/credits
// @desc    Get user's credit information
// @access  Private
router.get('/credits', asyncHandler(async (req, res) => {
    let creditLimit = await CreditLimit.findOne({ user: req.userId });

    if (!creditLimit) {
        // Create default credit limit
        creditLimit = new CreditLimit({
            user: req.userId,
            creditLimit: 0,
            availableCredit: 0,
            usedCredit: 0
        });
        await creditLimit.save();
    }

    res.json({
        creditLimit: creditLimit.toJSON()
    });
}));

// @route   GET /api/finance/transactions
// @desc    Get user's credit transactions
// @access  Private
router.get('/transactions', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isString().withMessage('Type must be a string'),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.userId };

    if (req.query.type) {
        filter.type = req.query.type;
    }

    if (req.query.status) {
        filter.status = req.query.status;
    }

    const transactions = await CreditLedger.find(filter)
        .populate('reference.id', 'offerId paymentId')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit);

    const total = await CreditLedger.countDocuments(filter);

    res.json({
        transactions,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
}));

// @route   GET /api/finance/payments
// @desc    Get user's payments
// @access  Private
router.get('/payments', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'processing', 'authorized', 'captured', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'disputed', 'timeout']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {
        $or: [
            { payer: req.userId },
            { payee: req.userId }
        ]
    };

    if (req.query.status) {
        filter.status = req.query.status;
    }

    const payments = await Payment.find(filter)
        .populate('payer', 'firstName lastName businessName')
        .populate('payee', 'firstName lastName businessName')
        .sort({ initiatedAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({
        payments,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
}));

// @route   GET /api/finance/analytics/summary
// @desc    Get finance analytics summary
// @access  Private
router.get('/analytics/summary', asyncHandler(async (req, res) => {
    const userId = req.userId;

    // Get credit summary
    const creditLimit = await CreditLimit.findOne({ user: userId }) || {
        creditLimit: 0,
        availableCredit: 0,
        usedCredit: 0
    };

    // Get transaction summary
    const transactionStats = await CreditLedger.aggregate([
        { $match: { user: userId } },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);

    // Get payment summary
    const paymentStats = await Payment.aggregate([
        { $match: { $or: [{ payer: userId }, { payee: userId }] } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);

    res.json({
        credits: {
            limit: creditLimit.creditLimit,
            available: creditLimit.availableCredit,
            used: creditLimit.usedCredit,
            utilizationPercentage: creditLimit.creditLimit > 0
                ? Math.round((creditLimit.usedCredit / creditLimit.creditLimit) * 100)
                : 0
        },
        transactions: transactionStats,
        payments: paymentStats
    });
}));

// Wallet endpoints (basic placeholders)
router.get('/wallet/balance', asyncHandler(async (req, res) => {
    res.json({
        balance: 0,
        currency: 'INR',
        lastUpdated: new Date().toISOString(),
        walletType: 'main',
        availableBalance: 0,
        pendingAmount: 0,
        frozenAmount: 0,
        creditLimit: 0,
        usedCredit: 0,
    });
}));

router.get('/wallet/all', asyncHandler(async (req, res) => {
    res.json({
        mainWallet: { balance: 0, availableBalance: 0, pendingAmount: 0, currency: 'INR' },
        vendorWallet: { balance: 0, availableBalance: 0, pendingAmount: 0, currency: 'INR' },
        affiliateWallet: { balance: 0, availableBalance: 0, pendingAmount: 0, creditLimit: 0, usedCredit: 0, currency: 'INR' },
        cashbackWallet: { balance: 0, availableBalance: 0, pendingAmount: 0, currency: 'INR' },
    });
}));

router.get('/wallet/transactions', asyncHandler(async (req, res) => {
    res.json({
        transactions: [],
        pagination: { page: 1, limit: 20, total: 0, hasMore: false },
    });
}));

router.post('/wallet/add', asyncHandler(async (req, res) => {
    res.json({
        id: `txn_${Date.now()}`,
        type: 'credit',
        amount: req.body.amount,
        walletType: req.body.walletType || 'main',
        description: req.body.description || 'Wallet Recharge',
        status: 'completed',
        reference: `PAY${Date.now()}`,
        createdAt: new Date().toISOString(),
        balanceAfter: 0,
        fee: 0,
        tax: 0,
        netAmount: req.body.amount,
    });
}));

router.post('/wallet/withdraw', asyncHandler(async (req, res) => {
    res.json({
        id: `wd_${Date.now()}`,
        amount: req.body.amount,
        walletType: req.body.walletType || 'main',
        description: req.body.description || 'Wallet Withdrawal',
        status: 'pending',
        fee: 25.0,
        tax: 0,
        netAmount: req.body.amount - 25.0,
        requestedAt: new Date().toISOString(),
        estimatedProcessingTime: '2-3 business days',
        reference: `WD${Date.now()}`,
    });
}));

router.post('/wallet/refund', asyncHandler(async (req, res) => {
    res.json({
        id: `rf_${Date.now()}`,
        orderId: req.body.orderId,
        amount: req.body.amount,
        reason: req.body.reason,
        walletType: req.body.walletType || 'main',
        status: 'processing',
        processingFee: 0,
        taxDeducted: 0,
        refundAmount: req.body.amount,
        requestedAt: new Date().toISOString(),
        estimatedProcessingTime: '5-7 business days',
        reference: `RF${Date.now()}`,
    });
}));

router.post('/wallet/2fa/enable', asyncHandler(async (req, res) => {
    res.json({
        enabled: true,
        method: 'sms',
        phoneNumber: req.body.phoneNumber,
        setupCompletedAt: new Date().toISOString(),
        backupCodes: Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 8).toUpperCase()),
    });
}));

router.post('/wallet/2fa/verify', asyncHandler(async (req, res) => {
    if (req.body.code !== '123456') {
        return res.status(400).json({ error: 'Invalid verification code' });
    }
    res.json({ verified: true, verifiedAt: new Date().toISOString() });
}));

router.post('/wallet/limits', asyncHandler(async (req, res) => {
    res.json({
        dailyWithdrawal: req.body.limits?.dailyWithdrawal || 50000,
        monthlyWithdrawal: req.body.limits?.monthlyWithdrawal || 500000,
        minimumWithdrawal: req.body.limits?.minimumWithdrawal || 500,
        maximumWithdrawal: req.body.limits?.maximumWithdrawal || 25000,
        dailyTransaction: req.body.limits?.dailyTransaction || 100000,
        singleTransaction: req.body.limits?.singleTransaction || 25000,
    });
}));

router.post('/wallet/fraud', asyncHandler(async (req, res) => {
    const fraudScore = Math.random();
    const riskLevel = fraudScore > 0.8 ? 'high' : fraudScore > 0.5 ? 'medium' : 'low';
    res.json({
        transactionId: req.body.transactionId,
        fraudScore,
        riskLevel,
        flagged: fraudScore > 0.7,
        reasons: fraudScore > 0.7 ? ['Unusual transaction pattern', 'Multiple failed attempts'] : [],
        recommendations: fraudScore > 0.7 ? ['Review required', 'Additional verification needed'] : [],
        analyzedAt: new Date().toISOString(),
    });
}));

// Invoice endpoints
router.get('/invoices', asyncHandler(async (req, res) => {
    const { vendorId, page = 1, limit = 20 } = req.query;
    const filter = vendorId ? { vendorId } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [total, invoices] = await Promise.all([
        Invoice.countDocuments(filter),
        Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    ]);
    res.json({
        invoices,
        pagination: { page: Number(page), limit: Number(limit), total, hasMore: skip + invoices.length < total },
    });
}));

router.post('/invoices', asyncHandler(async (req, res) => {
    const invoice = await Invoice.create({
        ...req.body,
        generatedAt: new Date().toISOString(),
    });
    res.status(201).json({ invoice });
}));

router.patch('/invoices/:id', asyncHandler(async (req, res) => {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ invoice });
}));

// Tax report placeholder
router.post('/tax-report', asyncHandler(async (req, res) => {
    res.json({
        id: `tax_${Date.now()}`,
        reportType: req.body.reportType,
        period: req.body.period,
        vendorId: req.body.vendorId,
        generatedAt: new Date().toISOString(),
        gstr1: {},
        gstr3b: {},
    });
}));

// Audit trail
router.get('/audit', asyncHandler(async (req, res) => {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ logs });
}));

router.post('/audit', asyncHandler(async (req, res) => {
    const log = await AuditLog.create({ ...req.body, userId: req.userId });
    res.status(201).json({ log });
}));

// Settlements
router.get('/settlements', asyncHandler(async (req, res) => {
    const settlements = await Settlement.find({}).sort({ createdAt: -1 }).lean();
    res.json({ settlements });
}));

router.post('/settlements', asyncHandler(async (req, res) => {
    const settlement = await Settlement.create({
        ...req.body,
        status: 'pending',
        scheduledAt: new Date().toISOString(),
    });
    res.status(201).json({ settlement });
}));

// Export tax report placeholder
router.post('/export', asyncHandler(async (req, res) => {
    res.json({
        reportId: req.body.reportId,
        format: req.body.format || 'pdf',
        downloadUrl: `/exports/tax-report-${req.body.reportId}.${req.body.format || 'pdf'}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
}));

// Reconciliation placeholder
router.post('/reconciliation', asyncHandler(async (req, res) => {
    res.json({
        id: `rec_${Date.now()}`,
        period: req.body.period,
        accountIds: req.body.accountIds || [],
        performedAt: new Date().toISOString(),
        status: 'completed',
        matchedTransactions: 0,
        unmatchedTransactions: 0,
        discrepancies: [],
        summary: {
            totalCredits: 0,
            totalDebits: 0,
            netDifference: 0,
            matchRate: 100,
        },
    });
}));

// Financial analytics placeholder
router.get('/analytics', asyncHandler(async (req, res) => {
    res.json({
        revenue: { total: 0, growth: 0, breakdown: {} },
        profitability: { gross: 0, net: 0, margin: 0 },
        cashFlow: { inflow: 0, outflow: 0, net: 0 },
        forecasting: { nextMonth: 0, nextQuarter: 0, confidence: 0 },
        trends: [],
    });
}));

// Vendor financial health placeholder
router.get('/vendor-health', asyncHandler(async (req, res) => {
    res.json({
        vendorId: req.query.vendorId,
        overallScore: 0,
        riskLevel: 'low',
        metrics: {},
        alerts: [],
        trends: {},
        recommendations: [],
    });
}));

// Market trends placeholder
router.get('/market-trends', asyncHandler(async (req, res) => {
    res.json({
        category: req.query.category,
        timeRange: req.query.timeRange,
        marketSize: 0,
        growthRate: 0,
        topTrends: [],
        competitiveAnalysis: {},
        forecasts: {},
    });
}));

// Credit request placeholder
router.post('/credit/request', asyncHandler(async (req, res) => {
    res.status(201).json({
        id: `cr_${Date.now()}`,
        buyerId: req.body.buyerId,
        vendorId: req.body.vendorId,
        requestedAmount: req.body.amount,
        purpose: req.body.purpose,
        tenure: req.body.tenure,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });
}));

// Credit approval placeholder
router.post('/credit/approve', asyncHandler(async (req, res) => {
    res.json({
        id: `ca_${Date.now()}`,
        requestId: req.body.requestId,
        creditLimit: req.body.approvedAmount,
        availableCredit: req.body.approvedAmount,
        usedCredit: 0,
        interestRate: req.body.interestRate,
        tenure: req.body.tenure,
        status: 'active',
        createdAt: new Date().toISOString(),
    });
}));

// Process order credit placeholder
router.post('/credit/process', asyncHandler(async (req, res) => {
    res.json({
        id: `ct_${Date.now()}`,
        accountId: req.body.accountId,
        orderId: req.body.orderId,
        type: 'debit',
        amount: req.body.amount,
        description: `Order credit utilization for order ${req.body.orderId}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        balanceAfter: 0,
    });
}));

// NACH mandate placeholder
router.post('/nach/mandate', asyncHandler(async (req, res) => {
    res.json({
        id: `nach_${Date.now()}`,
        accountId: req.body.accountId,
        bankDetails: req.body.bankDetails,
        amount: req.body.amount,
        frequency: req.body.frequency,
        status: 'pending_verification',
        createdAt: new Date().toISOString(),
        umrn: `UMRN${Date.now()}`,
    });
}));

// NACH debit placeholder
router.post('/nach/debit', asyncHandler(async (req, res) => {
    res.json({
        id: `nach_debit_${Date.now()}`,
        mandateId: req.body.mandateId,
        amount: req.body.amount,
        dueDate: req.body.dueDate,
        status: 'completed',
        processedAt: new Date().toISOString(),
        failureReason: null,
        retryCount: 0,
    });
}));

// Risk score placeholder
router.post('/risk/score', asyncHandler(async (req, res) => {
    res.json({
        buyerId: req.body.buyerId,
        riskScore: 0,
        riskLevel: 'low',
        riskFactors: {},
        recommendations: [],
        assessedAt: new Date().toISOString(),
    });
}));

// Penalty placeholder
router.post('/penalties', asyncHandler(async (req, res) => {
    res.json({
        id: `penalty_${Date.now()}`,
        accountId: req.body.accountId,
        penaltyType: req.body.penaltyType,
        amount: req.body.amount,
        reason: req.body.reason,
        status: 'applied',
        appliedAt: new Date().toISOString(),
        waiverAvailable: req.body.penaltyType === 'bounce',
    });
}));

// Credit ledger placeholder
router.get('/ledger', asyncHandler(async (req, res) => {
    res.json({
        accountId: req.query.accountId,
        transactions: [],
        filters: req.query,
    });
}));

module.exports = router;
