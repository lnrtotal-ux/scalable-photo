// Database connection utility
const sql = require('mssql');

const config = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

async function query(queryString, params = {}) {
    try {
        const poolConnection = await getPool();
        const request = poolConnection.request();
        
        // Add parameters
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.query(queryString);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function executeStoredProc(procName, params = {}) {
    try {
        const poolConnection = await getPool();
        const request = poolConnection.request();
        
        // Add parameters
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.execute(procName);
        return result;
    } catch (error) {
        console.error('Stored procedure error:', error);
        throw error;
    }
}

module.exports = {
    query,
    executeStoredProc,
    getPool,
    sql
};
