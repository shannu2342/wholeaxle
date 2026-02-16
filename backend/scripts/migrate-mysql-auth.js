require('dotenv').config();
const { initializeMySQL } = require('../config/mysql');

const run = async () => {
    try {
        await initializeMySQL();
        console.log('MySQL auth schema is ready.');
        process.exit(0);
    } catch (error) {
        console.error('MySQL auth migration failed:', error.message);
        process.exit(1);
    }
};

run();

