import pool from './config';

export interface TrackedEmail {
  id: string;
  user_id: string;
  email_id: string | null;
  subject: string;
  recipient: string;
  sent_at: Date;
  read_at: Date | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export interface TrackedEmailLink {
  id: string;
  tracked_email_id: string;
  url: string;
  clicked_at: Date;
  created_at: Date;
}

/**
 * Get all tracked emails for a user
 */
export const getTrackedEmails = async (userId: string): Promise<TrackedEmail[]> => {
  const query = 'SELECT * FROM tracked_emails WHERE user_id = $1 ORDER BY sent_at DESC';
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Get tracked email by ID
 */
export const getTrackedEmailById = async (id: string, userId: string): Promise<TrackedEmail | null> => {
  const query = 'SELECT * FROM tracked_emails WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Create a new tracked email
 */
export const createTrackedEmail = async (
  data: Omit<TrackedEmail, 'id' | 'read_at' | 'created_at' | 'updated_at'>
): Promise<TrackedEmail> => {
  const query = `
    INSERT INTO tracked_emails (
      user_id, email_id, subject, recipient, sent_at, status
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const values = [
    data.user_id,
    data.email_id,
    data.subject,
    data.recipient,
    data.sent_at,
    data.status
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Mark a tracked email as read
 */
export const markEmailAsRead = async (id: string, userId: string): Promise<TrackedEmail | null> => {
  const query = `
    UPDATE tracked_emails 
    SET read_at = CURRENT_TIMESTAMP, 
        status = 'read', 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [id, userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Update tracked email status
 */
export const updateTrackedEmailStatus = async (
  id: string, 
  userId: string, 
  status: TrackedEmail['status']
): Promise<TrackedEmail | null> => {
  const query = `
    UPDATE tracked_emails 
    SET status = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [id, userId, status]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Get all link clicks for a tracked email
 */
export const getTrackedEmailLinks = async (trackedEmailId: string): Promise<TrackedEmailLink[]> => {
  const query = 'SELECT * FROM tracked_email_links WHERE tracked_email_id = $1 ORDER BY clicked_at DESC';
  const result = await pool.query(query, [trackedEmailId]);
  return result.rows;
};

/**
 * Record a link click for a tracked email
 */
export const recordLinkClick = async (
  trackedEmailId: string,
  url: string
): Promise<TrackedEmailLink> => {
  const query = `
    INSERT INTO tracked_email_links (tracked_email_id, url, clicked_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  
  const result = await pool.query(query, [trackedEmailId, url]);
  return result.rows[0];
};

/**
 * Generate a tracking pixel URL
 */
export const generateTrackingPixel = (trackingId: string, baseUrl: string): string => {
  return `${baseUrl}/api/tracking/pixel/${trackingId}`;
};

/**
 * Add tracking to links in email content
 */
export const addTrackingToLinks = (
  content: string, 
  trackingId: string, 
  baseUrl: string
): string => {
  // Replace all <a href="..."> links with tracked versions
  return content.replace(
    /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi,
    (match, url, rest) => {
      // Add tracking parameter to URL
      const trackingUrl = `${baseUrl}/api/tracking/link/${trackingId}?url=${encodeURIComponent(url)}`;
      return `<a href="${trackingUrl}"${rest}>`;
    }
  );
};

/**
 * Get tracking statistics for a user
 */
export const getTrackingStats = async (userId: string): Promise<{
  total: number;
  read: number;
  readRate: number;
  linkClicks: number;
}> => {
  const query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
      (
        SELECT COUNT(*) 
        FROM tracked_email_links tel
        JOIN tracked_emails te ON tel.tracked_email_id = te.id
        WHERE te.user_id = $1
      ) as link_clicks
    FROM tracked_emails
    WHERE user_id = $1
  `;
  
  const result = await pool.query(query, [userId]);
  const stats = result.rows[0];
  
  return {
    total: parseInt(stats.total) || 0,
    read: parseInt(stats.read) || 0,
    readRate: stats.total > 0 ? (stats.read / stats.total) * 100 : 0,
    linkClicks: parseInt(stats.link_clicks) || 0
  };
};
