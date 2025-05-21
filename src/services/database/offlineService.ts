import pool from './config';

export interface OfflineEmail {
  id: string;
  user_id: string;
  to_recipients: string[];
  cc_recipients?: string[];
  bcc_recipients?: string[];
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'draft';
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all offline emails for a user
 */
export const getOfflineEmails = async (userId: string): Promise<OfflineEmail[]> => {
  const query = 'SELECT * FROM offline_emails WHERE user_id = $1 ORDER BY created_at DESC';
  const result = await pool.query(query, [userId]);
  
  // Convert JSON strings to arrays for recipients
  return result.rows.map(row => ({
    ...row,
    to_recipients: row.to_recipients,
    cc_recipients: row.cc_recipients || [],
    bcc_recipients: row.bcc_recipients || []
  }));
};

/**
 * Get offline emails by status
 */
export const getOfflineEmailsByStatus = async (
  userId: string,
  status: OfflineEmail['status']
): Promise<OfflineEmail[]> => {
  const query = 'SELECT * FROM offline_emails WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC';
  const result = await pool.query(query, [userId, status]);
  
  // Convert JSON strings to arrays for recipients
  return result.rows.map(row => ({
    ...row,
    to_recipients: row.to_recipients,
    cc_recipients: row.cc_recipients || [],
    bcc_recipients: row.bcc_recipients || []
  }));
};

/**
 * Get offline email by ID
 */
export const getOfflineEmailById = async (id: string, userId: string): Promise<OfflineEmail | null> => {
  const query = 'SELECT * FROM offline_emails WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Convert JSON strings to arrays for recipients
  const email = result.rows[0];
  return {
    ...email,
    to_recipients: email.to_recipients,
    cc_recipients: email.cc_recipients || [],
    bcc_recipients: email.bcc_recipients || []
  };
};

/**
 * Create a new offline email
 */
export const createOfflineEmail = async (
  data: Omit<OfflineEmail, 'id' | 'created_at' | 'updated_at'>
): Promise<OfflineEmail> => {
  const query = `
    INSERT INTO offline_emails (
      user_id, to_recipients, cc_recipients, bcc_recipients,
      subject, body, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    data.user_id,
    data.to_recipients,
    data.cc_recipients || [],
    data.bcc_recipients || [],
    data.subject,
    data.body,
    data.status
  ];
  
  const result = await pool.query(query, values);
  
  // Convert JSON strings to arrays for recipients
  const email = result.rows[0];
  return {
    ...email,
    to_recipients: email.to_recipients,
    cc_recipients: email.cc_recipients || [],
    bcc_recipients: email.bcc_recipients || []
  };
};

/**
 * Update an offline email
 */
export const updateOfflineEmail = async (
  id: string,
  userId: string,
  updates: Partial<Omit<OfflineEmail, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<OfflineEmail | null> => {
  // Build dynamic query based on provided updates
  const keys = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
  
  if (keys.length === 0) {
    return getOfflineEmailById(id, userId);
  }
  
  const setClauses = keys.map((key, index) => `${key} = $${index + 3}`);
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  
  const query = `
    UPDATE offline_emails 
    SET ${setClauses.join(', ')} 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const values = [id, userId, ...keys.map(key => updates[key as keyof typeof updates])];
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Convert JSON strings to arrays for recipients
  const email = result.rows[0];
  return {
    ...email,
    to_recipients: email.to_recipients,
    cc_recipients: email.cc_recipients || [],
    bcc_recipients: email.bcc_recipients || []
  };
};

/**
 * Update offline email status
 */
export const updateOfflineEmailStatus = async (
  id: string, 
  userId: string, 
  status: OfflineEmail['status']
): Promise<OfflineEmail | null> => {
  const query = `
    UPDATE offline_emails 
    SET status = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [id, userId, status]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Convert JSON strings to arrays for recipients
  const email = result.rows[0];
  return {
    ...email,
    to_recipients: email.to_recipients,
    cc_recipients: email.cc_recipients || [],
    bcc_recipients: email.bcc_recipients || []
  };
};

/**
 * Delete an offline email
 */
export const deleteOfflineEmail = async (id: string, userId: string): Promise<boolean> => {
  const query = 'DELETE FROM offline_emails WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rowCount > 0;
};

/**
 * Process pending offline emails
 */
export const processPendingOfflineEmails = async (
  userId: string,
  sendFunction: (email: OfflineEmail) => Promise<boolean>
): Promise<{ success: string[]; failed: string[] }> => {
  const pendingEmails = await getOfflineEmailsByStatus(userId, 'pending');
  
  const results = {
    success: [] as string[],
    failed: [] as string[]
  };
  
  // Process each pending email
  for (const email of pendingEmails) {
    try {
      const success = await sendFunction(email);
      
      if (success) {
        // Mark as sent
        await updateOfflineEmailStatus(email.id, userId, 'sent');
        results.success.push(email.id);
      } else {
        results.failed.push(email.id);
      }
    } catch (error) {
      console.error('Error sending offline email:', error);
      results.failed.push(email.id);
    }
  }
  
  return results;
};
