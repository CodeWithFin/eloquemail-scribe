import pool from './config';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
}

/**
 * Create a new user
 */
export const createUser = async (userData: Omit<User, 'id' | 'created_at'>): Promise<User> => {
  const query = `
    INSERT INTO users (
      email, password_hash
    ) VALUES ($1, $2)
    RETURNING *
  `;
  
  const values = [
    userData.email,
    userData.password_hash
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Get user by ID
 */
export const getUserById = async (id: number): Promise<User | null> => {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Update user information
 */
export const updateUser = async (id: number, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> => {
  // Build dynamic query based on provided updates
  const keys = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
  
  if (keys.length === 0) {
    return getUserById(id);
  }
  
  const setClauses = keys.map((key, index) => `${key} = $${index + 2}`);
  
  const query = `
    UPDATE users 
    SET ${setClauses.join(', ')} 
    WHERE id = $1 
    RETURNING *
  `;
  
  const values = [id, ...keys.map(key => updates[key as keyof typeof updates])];
  const result = await pool.query(query, values);
  
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Update Gmail tokens
 */
export const updateGmailTokens = async (
  userId: number, 
  token: string, 
  refreshToken: string | null, 
  expiryDate: Date
): Promise<boolean> => {
  // Using the gmail_auth table instead of users table
  const checkQuery = 'SELECT id FROM gmail_auth WHERE user_id = $1';
  const checkResult = await pool.query(checkQuery, [userId]);
  
  let query;
  let values;
  
  if (checkResult.rows.length > 0) {
    // Update existing record
    query = `
      UPDATE gmail_auth 
      SET gmail_token = $2, 
          gmail_refresh_token = $3, 
          gmail_token_expiry = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;
    values = [userId, token, refreshToken, expiryDate];
  } else {
    // Insert new record
    query = `
      INSERT INTO gmail_auth (user_id, gmail_token, gmail_refresh_token, gmail_token_expiry)
      VALUES ($1, $2, $3, $4)
    `;
    values = [userId, token, refreshToken, expiryDate];
  }
  
  const result = await pool.query(query, values);
  return result.rowCount > 0;
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  userId: number, 
  preferences: Record<string, any>
): Promise<boolean> => {
  // Using the user_preferences table instead of users table
  const checkQuery = 'SELECT id FROM user_preferences WHERE user_id = $1';
  const checkResult = await pool.query(checkQuery, [userId]);
  
  let query;
  let values;
  
  if (checkResult.rows.length > 0) {
    // Update existing record
    query = `
      UPDATE user_preferences 
      SET preferences = preferences || $2::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;
    values = [userId, preferences];
  } else {
    // Insert new record
    query = `
      INSERT INTO user_preferences (user_id, preferences)
      VALUES ($1, $2)
    `;
    values = [userId, preferences];
  }
  
  const result = await pool.query(query, values);
  return result.rowCount > 0;
};

/**
 * Get user Gmail authentication
 */
export const getUserGmailAuth = async (userId: number): Promise<{
  gmail_token: string | null;
  gmail_refresh_token: string | null;
  gmail_token_expiry: Date | null;
} | null> => {
  const query = 'SELECT gmail_token, gmail_refresh_token, gmail_token_expiry FROM gmail_auth WHERE user_id = $1';
  const result = await pool.query(query, [userId]);
  
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Delete user account
 */
export const deleteUser = async (userId: number): Promise<boolean> => {
  const query = 'DELETE FROM users WHERE id = $1';
  const result = await pool.query(query, [userId]);
  
  return result.rowCount > 0;
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (userId: number): Promise<Record<string, any> | null> => {
  const query = 'SELECT preferences FROM user_preferences WHERE user_id = $1';
  const result = await pool.query(query, [userId]);
  
  return result.rows.length > 0 ? result.rows[0].preferences : null;
};
