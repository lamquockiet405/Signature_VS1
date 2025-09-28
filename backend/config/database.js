const { Pool } = require("pg");
require("dotenv").config({ path: "./config.env" });

// Test database connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Database connection error:", err);
});

module.exports = pool;
