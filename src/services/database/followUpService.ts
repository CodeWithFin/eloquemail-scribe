import pool from './config';

export interface FollowUp {
  id: string;
  user_id: string;
  email_id: string | null;
  subject: string;
  recipient: string;
  due_date: Date;
  notes: string | null;
  status: 'pending' | 'completed' | 'snoozed';
  priority: 'high' | 'medium' | 'low';
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all follow-ups for a user
 */
export const getFollowUps = async (userId: string): Promise<FollowUp[]> => {
  const query = 'SELECT * FROM follow_ups WHERE user_id = $1 ORDER BY due_date ASC';
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Get follow-ups by status
 */
export const getFollowUpsByStatus = async (
  userId: string,
  status: FollowUp['status']
): Promise<FollowUp[]> => {
  const query = 'SELECT * FROM follow_ups WHERE user_id = $1 AND status = $2 ORDER BY due_date ASC';
  const result = await pool.query(query, [userId, status]);
  return result.rows;
};

/**
 * Get overdue follow-ups
 */
export const getOverdueFollowUps = async (userId: string): Promise<FollowUp[]> => {
  const query = `
    SELECT * FROM follow_ups 
    WHERE user_id = $1 
      AND status = 'pending' 
      AND due_date < CURRENT_TIMESTAMP
    ORDER BY due_date ASC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Get follow-up by ID
 */
export const getFollowUpById = async (id: string, userId: string): Promise<FollowUp | null> => {
  const query = 'SELECT * FROM follow_ups WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Create a new follow-up
 */
export const createFollowUp = async (
  followUp: Omit<FollowUp, 'id' | 'created_at' | 'updated_at'>
): Promise<FollowUp> => {
  const query = `
    INSERT INTO follow_ups (
      user_id, email_id, subject, recipient, 
      due_date, notes, status, priority
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const values = [
    followUp.user_id,
    followUp.email_id,
    followUp.subject,
    followUp.recipient,
    followUp.due_date,
    followUp.notes,
    followUp.status,
    followUp.priority
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Update follow-up status
 */
export const updateFollowUpStatus = async (
  id: string, 
  userId: string, 
  status: FollowUp['status']
): Promise<FollowUp | null> => {
  const query = `
    UPDATE follow_ups 
    SET status = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [id, userId, status]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Update follow-up due date
 */
export const updateFollowUpDueDate = async (
  id: string, 
  userId: string, 
  dueDate: Date
): Promise<FollowUp | null> => {
  const query = `
    UPDATE follow_ups 
    SET due_date = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [id, userId, dueDate]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Update a follow-up
 */
export const updateFollowUp = async (
  id: string,
  userId: string,
  updates: Partial<Omit<FollowUp, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<FollowUp | null> => {
  // Build dynamic query based on provided updates
  const keys = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
  
  if (keys.length === 0) {
    return getFollowUpById(id, userId);
  }
  
  const setClauses = keys.map((key, index) => `${key} = $${index + 3}`);
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  
  const query = `
    UPDATE follow_ups 
    SET ${setClauses.join(', ')} 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const values = [id, userId, ...keys.map(key => updates[key as keyof typeof updates])];
  const result = await pool.query(query, values);
  
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Delete a follow-up
 */
export const deleteFollowUp = async (id: string, userId: string): Promise<boolean> => {
  const query = 'DELETE FROM follow_ups WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rowCount > 0;
};

/**
 * Get follow-ups due today
 */
export const getFollowUpsDueToday = async (userId: string): Promise<FollowUp[]> => {
  const query = `
    SELECT * FROM follow_ups 
    WHERE user_id = $1 
      AND status = 'pending' 
      AND due_date::date = CURRENT_DATE
    ORDER BY due_date ASC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Get follow-ups due in the next N days
 */
export const getUpcomingFollowUps = async (userId: string, days: number): Promise<FollowUp[]> => {
  const query = `
    SELECT * FROM follow_ups 
    WHERE user_id = $1 
      AND status = 'pending' 
      AND due_date::date > CURRENT_DATE
      AND due_date::date <= (CURRENT_DATE + $2::interval)
    ORDER BY due_date ASC
  `;
  const result = await pool.query(query, [userId, `${days} days`]);
  return result.rows;
};
