const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('express-async-errors');
require('dotenv').config();

// Import configuration
const { initializeDatabase } = require('./config/database');

// Import middleware
const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = (process.env.AUTH_DB || 'mongo').toLowerCase() === 'mysql'
    ? require('./routes/auth.mysql')
    : require('./routes/auth');
const chatRoutes = require('./routes/chat');
const offersRoutes = require('./routes/offers');
const checkoutRoutes = require('./routes/checkout');
const financeRoutes = require('./routes/finance');
const systemRoutes = require('./routes/system');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const webhookRoutes = require('./routes/webhooks');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const locationRoutes = require('./routes/location');
const returnRoutes = require('./routes/returns');
const logisticsRoutes = require('./routes/logistics');
const affiliateRoutes = require('./routes/affiliate');
const marketingRoutes = require('./routes/marketing');
const analyticsRoutes = require('./routes/analytics');
const intelligenceRoutes = require('./routes/intelligence');
const inventoryRoutes = require('./routes/inventory');
const brandRoutes = require('./routes/brand');
const vendorRoutes = require('./routes/vendors');
const permissionRoutes = require('./routes/permissions');
const contentRoutes = require('./routes/content');
const supportRoutes = require('./routes/support');
const reviewRoutes = require('./routes/reviews');
const localizationRoutes = require('./routes/localization');
const aiRoutes = require('./routes/ai');

// Import socket handlers
const socketHandlers = require('./socket/handlers');

// Global variable to store database connections
let dbConnections = null;

// Start server function
const startServer = async () => {
    try {
        // Initialize database connections
        logger.info('Initializing database connections...');
        dbConnections = await initializeDatabase();

        const app = express();
        const server = http.createServer(app);
        const io = socketIo(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        const PORT = process.env.PORT || 8000;

        // Security middleware
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'", "ws:", "wss:"],
                },
            },
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.'
        });

        const speedLimiter = slowDown({
            windowMs: 15 * 60 * 1000, // 15 minutes
            delayAfter: 50, // allow 50 requests per 15 minutes at full speed
            delayMs: 500 // add 500ms delay per request after delayAfter
        });

        // Apply middlewares
        app.use(limiter);
        app.use(speedLimiter);
        app.use(compression());
        app.use(cors({
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true
        }));

        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // API Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/chat', authMiddleware, chatRoutes);
        app.use('/api/offers', authMiddleware, offersRoutes);
        app.use('/api/checkout', authMiddleware, checkoutRoutes);
        app.use('/api/finance', authMiddleware, financeRoutes);
        app.use('/api/system', authMiddleware, systemRoutes);
        app.use('/api/admin', authMiddleware, adminRoutes);
        app.use('/api/notifications', authMiddleware, notificationRoutes);
        app.use('/api/upload', authMiddleware, uploadRoutes);
        app.use('/api/webhooks', webhookRoutes);
        app.use('/api/products', productRoutes);
        app.use('/api/categories', categoryRoutes);
        app.use('/api/orders', orderRoutes);
        app.use('/api/location', locationRoutes);
        app.use('/api/returns', returnRoutes);
        app.use('/api/logistics', logisticsRoutes);
        app.use('/api/affiliate', affiliateRoutes);
        app.use('/api/marketing', marketingRoutes);
        app.use('/api/analytics', analyticsRoutes);
        app.use('/api/intelligence', intelligenceRoutes);
        app.use('/api/inventory', inventoryRoutes);
        app.use('/api/brand', brandRoutes);
        app.use('/api/vendors', vendorRoutes);
        app.use('/api/permissions', permissionRoutes);
        app.use('/api/content', contentRoutes);
        app.use('/api/support', supportRoutes);
        app.use('/api/reviews', reviewRoutes);
        app.use('/api/localization', localizationRoutes);
        app.use('/api/ai', aiRoutes);

        // Socket.io connection handling
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                // Verify JWT token
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Get user from database
                const { findUserById } = require('./services/authUserService');
                const user = await findUserById(decoded.id);
                if (!user || !user.isActive) {
                    return next(new Error('User not found or inactive'));
                }

                socket.userId = String(user.id || user._id);
                socket.userRole = user.role;
                socket.user = user;
                next();
            } catch (error) {
                logger.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });

        io.on('connection', (socket) => {
            logger.info(`User ${socket.userId} connected with socket ${socket.id}`);

            // Join user to their personal room
            socket.join(`user:${socket.userId}`);

            // Handle real-time events
            socketHandlers.handleConnection(socket, io);

            socket.on('disconnect', () => {
                logger.info(`User ${socket.userId} disconnected`);
                socketHandlers.handleDisconnection(socket, io);
            });
        });

        // Error handling middleware
        app.use(errorHandler);

        // 404 handler
        app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                path: req.originalUrl
            });
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received. Shutting down gracefully...`);

            if (server) {
                server.close(() => {
                    logger.info('HTTP server closed');
                });
            }

            if (dbConnections) {
                const { closeDatabaseConnections } = require('./config/database');
                await closeDatabaseConnections(dbConnections);
            }

            logger.info('Process terminated');
            process.exit(0);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Start server
        server.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
        });

        return { app, server, io, dbConnections };
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = { app: null, server: null, io: null, startServer };
