import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined in environment variables. Please check your .env file.');
}

// NeonDB connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for NeonDB
  }
});

export default pool;
