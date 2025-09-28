const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: "../config.env" });

async function runMigrations() {
  try {
    console.log("Starting database migration...");

    // Read schema file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Execute schema
    await pool.query(schema);

    console.log("✅ Database migration completed successfully!");

    // Ensure extra file metadata columns exist
    await pool.query(`
      ALTER TABLE IF EXISTS files 
      ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reason TEXT,
      ADD COLUMN IF NOT EXISTS location VARCHAR(255),
      ADD COLUMN IF NOT EXISTS sign_datetime TIMESTAMP NULL;
    `);
    console.log("✅ Ensured files extra metadata columns exist");

    // Create demo user
    const bcrypt = require("bcryptjs");
    const demoPassword = await bcrypt.hash("demo123", 12);

    const demoUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, mst, full_name, organization)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [
        "demo",
        "demo@example.com",
        demoPassword,
        "0123456789",
        "Demo User",
        "Demo Organization",
      ]
    );

    if (demoUser.rows.length > 0) {
      console.log("✅ Demo user created successfully!");
      console.log("   Username: demo");
      console.log("   Password: demo123");
      console.log("   MST: 0123456789");
    } else {
      console.log("ℹ️  Demo user already exists");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
