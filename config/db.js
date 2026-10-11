require("dotenv").config();
const { Pool, types } = require("pg");

// Return DATE columns as plain "YYYY-MM-DD" strings (avoids timezone shifts)
types.setTypeParser(1082, (value) => value);

// Return NUMERIC columns as numbers instead of strings
types.setTypeParser(1700, (value) => parseFloat(value));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;