const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const { initializeMySQL } = require('./mysql');

// MongoDB connection
const connectMongoDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not set');
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || '5000', 10),
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

        return conn;
    } catch (error) {
        logger.error('MongoDB connection failed:', error);
        throw error;
    }
};

// PostgreSQL connection using Sequelize
const connectPostgreSQL = async () => {
    if (!process.env.POSTGRES_URI) {
        logger.info('POSTGRES_URI not set, skipping PostgreSQL connection');
        return null;
    }

    try {
        const sequelize = new Sequelize(process.env.POSTGRES_URI, {
            dialect: 'postgres',
            logging: (msg) => logger.debug(msg), // Log SQL queries in debug mode
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            define: {
                timestamps: true,
                underscored: true
            }
        });

        // Test connection
        await sequelize.authenticate();
        logger.info('PostgreSQL Connected Successfully');

        // Handle connection events
        sequelize.beforeConnect((config) => {
            logger.info(`Attempting to connect to PostgreSQL: ${config.database}`);
        });

        sequelize.afterConnect((connection) => {
            logger.info('PostgreSQL connection established');
        });

        sequelize.beforeDisconnect((connection) => {
            logger.info('Disconnecting from PostgreSQL');
        });

        return sequelize;
    } catch (error) {
        logger.error('PostgreSQL connection failed:', error);
        throw error;
    }
};

// Redis connection
const connectRedis = async () => {
    try {
        const redis = require('redis');
        const client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            retry_strategy: (options) => {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    logger.error('Redis server refused connection');
                    return new Error('Redis server refused connection');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    logger.error('Redis retry time exhausted');
                    return new Error('Retry time exhausted');
                }
                if (options.attempt > 10) {
                    logger.error('Redis max retry attempts reached');
                    return undefined;
                }
                // Reconnect after
                return Math.min(options.attempt * 100, 3000);
            }
        });

        client.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });

        client.on('connect', () => {
            logger.info('Redis Client Connected');
        });

        client.on('ready', () => {
            logger.info('Redis Client Ready');
        });

        client.on('end', () => {
            logger.info('Redis Client Disconnected');
        });

        await client.connect();
        return client;
    } catch (error) {
        logger.error('Redis connection failed:', error);
        // Don't exit process for Redis failure, it's not critical
        return null;
    }
};

// Initialize all database connections
const initializeDatabase = async () => {
    try {
        logger.info('Initializing database connections...');
        const authDbMode = (process.env.AUTH_DB || 'mongo').toLowerCase();

        let mongoConnection = null;
        let mysqlConnection = null;

        // Keep MongoDB connected for non-auth marketplace modules unless explicitly unavailable.
        if (process.env.MONGODB_URI) {
            try {
                mongoConnection = await connectMongoDB();
            } catch (error) {
                if (authDbMode === 'mysql') {
                    logger.warn(`MongoDB unavailable in AUTH_DB=mysql mode: ${error.message}. Continuing with auth-only MySQL mode.`);
                } else {
                    throw error;
                }
            }
        } else if (authDbMode !== 'mysql') {
            throw new Error('MONGODB_URI is required when AUTH_DB is not mysql');
        } else {
            logger.warn('MONGODB_URI not set while AUTH_DB=mysql. Non-auth Mongo-backed modules may fail.');
        }

        if (authDbMode === 'mysql') {
            mysqlConnection = await initializeMySQL();
            logger.info('Auth DB mode: mysql');
        } else {
            logger.info('Auth DB mode: mongo');
        }

        // Connect to PostgreSQL (for complex queries and analytics)
        let postgresConnection = null;
        try {
            postgresConnection = await connectPostgreSQL();
        } catch (error) {
            logger.warn('PostgreSQL connection failed, continuing without it:', error.message);
        }

        // Connect to Redis (for caching and sessions)
        let redisConnection = null;
        try {
            redisConnection = await connectRedis();
        } catch (error) {
            logger.warn('Redis connection failed, continuing without it:', error.message);
        }

        logger.info('Database initialization completed');

        return {
            mongo: mongoConnection,
            mysql: mysqlConnection,
            postgres: postgresConnection,
            redis: redisConnection
        };
    } catch (error) {
        logger.error('Database initialization failed:', error);
        process.exit(1);
    }
};

// Graceful shutdown
const closeDatabaseConnections = async (connections) => {
    try {
        logger.info('Closing database connections...');

        // Close MongoDB connection
        if (connections.mongo) {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
        }

        if (connections.mysql) {
            await connections.mysql.close();
            logger.info('MySQL connection closed');
        }

        // Close PostgreSQL connection
        if (connections.postgres) {
            await connections.postgres.close();
            logger.info('PostgreSQL connection closed');
        }

        // Close Redis connection
        if (connections.redis) {
            await connections.redis.quit();
            logger.info('Redis connection closed');
        }

        logger.info('All database connections closed successfully');
    } catch (error) {
        logger.error('Error closing database connections:', error);
    }
};

// Database health check
const checkDatabaseHealth = async (connections) => {
    const health = {
        mongodb: false,
        mysql: false,
        postgresql: false,
        redis: false,
        timestamp: new Date().toISOString()
    };

    // Check MongoDB
    if (connections.mongo) {
        try {
            await mongoose.connection.db.admin().ping();
            health.mongodb = true;
        } catch (error) {
            logger.error('MongoDB health check failed:', error);
        }
    }

    // Check PostgreSQL
    if (connections.postgres) {
        try {
            await connections.postgres.authenticate();
            health.postgresql = true;
        } catch (error) {
            logger.error('PostgreSQL health check failed:', error);
        }
    }

    // Check MySQL
    if (connections.mysql) {
        try {
            await connections.mysql.authenticate();
            health.mysql = true;
        } catch (error) {
            logger.error('MySQL health check failed:', error);
        }
    }

    // Check Redis
    if (connections.redis) {
        try {
            await connections.redis.ping();
            health.redis = true;
        } catch (error) {
            logger.error('Redis health check failed:', error);
        }
    }

    return health;
};

module.exports = {
    connectMongoDB,
    connectPostgreSQL,
    connectRedis,
    initializeDatabase,
    closeDatabaseConnections,
    checkDatabaseHealth
};
