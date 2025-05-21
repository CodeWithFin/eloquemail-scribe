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

async function checkTableStructure() {
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await client.connect();
    
    // Check the structure of the users table
    console.log('\nUsers table structure:');
    const usersResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    // Display users table structure
    usersResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} ${row.column_default ? `(default: ${row.column_default})` : ''}`);
    });
    
    // Check the structure of other tables
    const tables = ['email_templates', 'email_snippets', 'follow_ups', 'tracked_emails'];
    
    for (const table of tables) {
      console.log(`\n${table} table structure:`);
      const result = await client.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = '${table}'
        ORDER BY ordinal_position;
      `);
      
      // Display table structure
      result.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} ${row.column_default ? `(default: ${row.column_default})` : ''}`);
      });
    }
    
    console.log('\nTable structure check completed!');
  } catch (err) {
    console.error('Error checking table structure:', err);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Run the function
checkTableStructure();
