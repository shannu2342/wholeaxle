const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const { initAuthUserModel } = require('../models/AuthUserSql');

let sequelize = null;

const getMySQLSequelize = () => {
    if (sequelize) return sequelize;

    const database = process.env.MYSQL_DATABASE;
    const username = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;
    const host = process.env.MYSQL_HOST || '127.0.0.1';
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

    sequelize = new Sequelize(database, username, password, {
        host,
        port,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            charset: 'utf8mb4'
        },
        define: {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        }
    });

    return sequelize;
};

const initializeMySQL = async () => {
    const db = getMySQLSequelize();
    await db.authenticate();
    initAuthUserModel(db);
    await db.sync();
    logger.info('MySQL Connected Successfully');
    return db;
};

module.exports = {
    getMySQLSequelize,
    initializeMySQL
};

