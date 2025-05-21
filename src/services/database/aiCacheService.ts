import pool from './config';

export interface AIAnalysisCache {
  id: string;
  user_id: string;
  email_id: string;
  analysis_type: string;
  content: any;
  created_at: Date;
  expires_at: Date | null;
}

/**
 * Get cached AI analysis for an email
 */
export const getCachedAnalysis = async (
  userId: string,
  emailId: string,
  analysisType: string
): Promise<AIAnalysisCache | null> => {
  const query = `
    SELECT * FROM ai_analysis_cache 
    WHERE user_id = $1 
      AND email_id = $2 
      AND analysis_type = $3
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `;
  
  const result = await pool.query(query, [userId, emailId, analysisType]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    ...result.rows[0],
    content: result.rows[0].content
  };
};

/**
 * Store AI analysis in cache
 */
export const cacheAnalysis = async (
  data: Omit<AIAnalysisCache, 'id' | 'created_at'>
): Promise<AIAnalysisCache> => {
  // Check if an entry already exists and update it if it does
  const existingCache = await getCachedAnalysis(data.user_id, data.email_id, data.analysis_type);
  
  if (existingCache) {
    const query = `
      UPDATE ai_analysis_cache 
      SET content = $4, expires_at = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      existingCache.id,
      data.content,
      data.expires_at
    ]);
    
    return {
      ...result.rows[0],
      content: result.rows[0].content
    };
  }
  
  // Otherwise, create a new entry
  const query = `
    INSERT INTO ai_analysis_cache (
      user_id, email_id, analysis_type, content, expires_at
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const values = [
    data.user_id,
    data.email_id,
    data.analysis_type,
    data.content,
    data.expires_at
  ];
  
  const result = await pool.query(query, values);
  
  return {
    ...result.rows[0],
    content: result.rows[0].content
  };
};

/**
 * Delete cached analysis
 */
export const deleteCachedAnalysis = async (
  userId: string,
  emailId: string,
  analysisType?: string
): Promise<boolean> => {
  let query: string;
  let values: any[];
  
  if (analysisType) {
    query = 'DELETE FROM ai_analysis_cache WHERE user_id = $1 AND email_id = $2 AND analysis_type = $3';
    values = [userId, emailId, analysisType];
  } else {
    query = 'DELETE FROM ai_analysis_cache WHERE user_id = $1 AND email_id = $2';
    values = [userId, emailId];
  }
  
  const result = await pool.query(query, values);
  return result.rowCount > 0;
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = async (): Promise<number> => {
  const query = 'DELETE FROM ai_analysis_cache WHERE expires_at < CURRENT_TIMESTAMP';
  const result = await pool.query(query);
  return result.rowCount;
};

/**
 * Get all cached analyses for a user
 */
export const getAllCachedAnalyses = async (userId: string): Promise<AIAnalysisCache[]> => {
  const query = `
    SELECT * FROM ai_analysis_cache 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `;
  
  const result = await pool.query(query, [userId]);
  
  return result.rows.map(row => ({
    ...row,
    content: row.content
  }));
};
