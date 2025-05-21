import pool from './config';

export interface ScheduledEmail {
  id: string;
  user_id: string;
  to_recipients: string[];
  cc_recipients?: string[];
  bcc_recipients?: string[];
  subject: string;
  body: string;
  scheduled_time: Date;
  status: 'scheduled' | 'sent' | 'failed';
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all scheduled emails for a user
 */
export const getScheduledEmails = async (userId: string): Promise<ScheduledEmail[]> => {
  const query = 'SELECT * FROM scheduled_emails WHERE user_id = $1 ORDER BY scheduled_time ASC';
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
 * Get scheduled email by ID
 */
export const getScheduledEmailById = async (id: string, userId: string): Promise<ScheduledEmail | null> => {
  const query = 'SELECT * FROM scheduled_emails WHERE id = $1 AND user_id = $2';
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
 * Create a new scheduled email
 */
export const scheduleEmail = async (
  data: Omit<ScheduledEmail, 'id' | 'created_at' | 'updated_at'>
): Promise<ScheduledEmail> => {
  const query = `
    INSERT INTO scheduled_emails (
      user_id, to_recipients, cc_recipients, bcc_recipients,
      subject, body, scheduled_time, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const values = [
    data.user_id,
    data.to_recipients,
    data.cc_recipients || [],
    data.bcc_recipients || [],
    data.subject,
    data.body,
    data.scheduled_time,
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
 * Update a scheduled email
 */
export const updateScheduledEmail = async (
  id: string,
  userId: string,
  updates: Partial<Omit<ScheduledEmail, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ScheduledEmail | null> => {
  // Build dynamic query based on provided updates
  const keys = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
  
  if (keys.length === 0) {
    return getScheduledEmailById(id, userId);
  }
  
  const setClauses = keys.map((key, index) => `${key} = $${index + 3}`);
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  
  const query = `
    UPDATE scheduled_emails 
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
 * Update scheduled email status
 */
export const updateScheduledEmailStatus = async (
  id: string, 
  userId: string, 
  status: ScheduledEmail['status']
): Promise<ScheduledEmail | null> => {
  const query = `
    UPDATE scheduled_emails 
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
 * Delete a scheduled email
 */
export const deleteScheduledEmail = async (id: string, userId: string): Promise<boolean> => {
  const query = 'DELETE FROM scheduled_emails WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rowCount > 0;
};

/**
 * Get emails scheduled to be sent in the next N minutes
 */
export const getEmailsDueForSending = async (minutes: number = 5): Promise<ScheduledEmail[]> => {
  const query = `
    SELECT * FROM scheduled_emails 
    WHERE status = 'scheduled' 
      AND scheduled_time <= (CURRENT_TIMESTAMP + $1::interval)
    ORDER BY scheduled_time ASC
  `;
  
  const result = await pool.query(query, [`${minutes} minutes`]);
  
  // Convert JSON strings to arrays for recipients
  return result.rows.map(row => ({
    ...row,
    to_recipients: row.to_recipients,
    cc_recipients: row.cc_recipients || [],
    bcc_recipients: row.bcc_recipients || []
  }));
};
