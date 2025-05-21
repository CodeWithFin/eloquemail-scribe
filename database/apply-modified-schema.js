import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Read the SQL file
const schemaPath = path.join(__dirname, 'schema-modified.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// NeonDB connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables. Please check your .env file.');
  process.exit(1);
}

// Create a new client
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyModifiedSchema() {
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await client.connect();
    
    // Set a longer statement timeout (5 minutes)
    await client.query('SET statement_timeout = 300000');
    
    console.log('Testing connection...');
    const testResult = await client.query('SELECT NOW() as current_time');
    console.log(`Connection successful! Server time: ${testResult.rows[0].current_time}`);
    
    // Apply the modified schema
    console.log('\nApplying modified schema...');
    await client.query(schema);
    
    // Check tables after creation
    console.log('\nVerifying tables after setup:');
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    // Display tables after setup
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\nModified schema applied successfully!');
  } catch (err) {
    console.error('Error applying modified schema:', err);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Run the setup
applyModifiedSchema();
