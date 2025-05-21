import { Client } from 'pg';

// NeonDB connection string
const connectionString = 'postgresql://email%20db_owner:npg_OZhsxN9gViK6@ep-black-violet-a517r03c-pooler.us-east-2.aws.neon.tech/email%20db?sslmode=require';

// Create a new client
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await client.connect();
    
    // List all tables in the database
    console.log('Listing tables in the database:');
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    // Display tables
    tableResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\nConnection test completed successfully!');
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Run the test
testConnection();
