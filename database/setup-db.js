import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the SQL file
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// NeonDB connection string
const connectionString = 'postgresql://email%20db_owner:npg_OZhsxN9gViK6@ep-black-violet-a517r03c-pooler.us-east-2.aws.neon.tech/email%20db?sslmode=require';

// Create a new client
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await client.connect();
    
    // Execute the schema SQL
    console.log('Creating database schema...');
    await client.query(schema);
    
    console.log('Database setup completed successfully!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Run the setup
setupDatabase();
