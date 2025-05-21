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

async function checkUsersTable() {
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await client.connect();
    
    // Check the structure of the users table
    console.log('\nUsers table structure:');
    const usersResult = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    // Display users table structure
    usersResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} ${row.column_default ? `(default: ${row.column_default})` : ''} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\nCheck completed!');
  } catch (err) {
    console.error('Error checking users table:', err);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Run the function
checkUsersTable();
