const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

let tickets = [];

const buildStats = (items) => ({
    total: items.length,
    open: items.filter((t) => t.status === 'open').length,
    inProgress: items.filter((t) => t.status === 'in_progress').length,
    resolved: items.filter((t) => t.status === 'resolved').length,
    avgResponseTime: 0,
    avgResolutionTime: 0,
    satisfactionRate: 0,
    slaCompliance: 0,
});

// @route   GET /api/support/tickets
// @desc    Get support tickets
// @access  Private
router.get('/tickets', authMiddleware, asyncHandler(async (req, res) => {
    const { status, priority, type, userId, page = 1, limit = 10 } = req.query;

    let filtered = [...tickets];
    if (status) filtered = filtered.filter((t) => t.status === status);
    if (priority) filtered = filtered.filter((t) => t.priority === priority);
    if (type) filtered = filtered.filter((t) => t.type === type);
    if (userId) filtered = filtered.filter((t) => t.userId === userId);

    const start = (Number(page) - 1) * Number(limit);
    const pageItems = filtered.slice(start, start + Number(limit));

    res.json({
        tickets: pageItems,
        stats: buildStats(filtered),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: filtered.length,
            hasMore: start + pageItems.length < filtered.length,
        },
    });
}));

// @route   POST /api/support/tickets
// @desc    Create support ticket
// @access  Private
router.post('/tickets', authMiddleware, asyncHandler(async (req, res) => {
    const ticket = {
        id: `ticket_${Date.now()}`,
        userId: req.userId,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [],
        ...req.body,
    };

    tickets.unshift(ticket);
    res.status(201).json({ ticket });
}));

// @route   PATCH /api/support/tickets/:id/status
// @desc    Update ticket status
// @access  Private
router.patch('/tickets/:id/status', authMiddleware, asyncHandler(async (req, res) => {
    const ticket = tickets.find((t) => t.id === req.params.id);
    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.status = req.body.status || ticket.status;
    ticket.updatedAt = new Date().toISOString();
    res.json({ ticket });
}));

// @route   POST /api/support/tickets/:id/assign
// @desc    Assign ticket
// @access  Private
router.post('/tickets/:id/assign', authMiddleware, asyncHandler(async (req, res) => {
    const ticket = tickets.find((t) => t.id === req.params.id);
    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.assignedTo = req.body.assignedTo;
    ticket.assignedBy = req.userId;
    ticket.assignedAt = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();

    res.json({ ticket });
}));

// @route   POST /api/support/tickets/:id/response
// @desc    Add response to ticket
// @access  Private
router.post('/tickets/:id/response', authMiddleware, asyncHandler(async (req, res) => {
    const ticket = tickets.find((t) => t.id === req.params.id);
    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
    }

    const response = {
        id: `response_${Date.now()}`,
        ticketId: ticket.id,
        userId: req.userId,
        content: req.body.content,
        createdAt: new Date().toISOString(),
    };

    ticket.responses = ticket.responses || [];
    ticket.responses.push(response);
    ticket.updatedAt = new Date().toISOString();

    res.status(201).json({ response, ticket });
}));

module.exports = router;
