import pool from './config';

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  category: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EmailSnippet {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all templates for a user
 */
export const getTemplates = async (userId: string): Promise<EmailTemplate[]> => {
  const query = 'SELECT * FROM email_templates WHERE user_id = $1 ORDER BY name ASC';
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Get template by ID
 */
export const getTemplateById = async (id: string, userId: string): Promise<EmailTemplate | null> => {
  const query = 'SELECT * FROM email_templates WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Create a new template
 */
export const createTemplate = async (
  template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailTemplate> => {
  const query = `
    INSERT INTO email_templates (user_id, name, content, category)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const values = [template.user_id, template.name, template.content, template.category];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Update an existing template
 */
export const updateTemplate = async (
  id: string,
  userId: string,
  updates: Partial<Omit<EmailTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<EmailTemplate | null> => {
  // Build dynamic query based on provided updates
  const keys = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
  
  if (keys.length === 0) {
    return getTemplateById(id, userId);
  }
  
  const setClauses = keys.map((key, index) => `${key} = $${index + 3}`);
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  
  const query = `
    UPDATE email_templates 
    SET ${setClauses.join(', ')} 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const values = [id, userId, ...keys.map(key => updates[key as keyof typeof updates])];
  const result = await pool.query(query, values);
  
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id: string, userId: string): Promise<boolean> => {
  const query = 'DELETE FROM email_templates WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rowCount > 0;
};

/**
 * Get all snippets for a user
 */
export const getSnippets = async (userId: string): Promise<EmailSnippet[]> => {
  const query = 'SELECT * FROM email_snippets WHERE user_id = $1 ORDER BY name ASC';
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Get snippet by ID
 */
export const getSnippetById = async (id: string, userId: string): Promise<EmailSnippet | null> => {
  const query = 'SELECT * FROM email_snippets WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Create a new snippet
 */
export const createSnippet = async (
  snippet: Omit<EmailSnippet, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailSnippet> => {
  const query = `
    INSERT INTO email_snippets (user_id, name, content)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  const values = [snippet.user_id, snippet.name, snippet.content];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Update an existing snippet
 */
export const updateSnippet = async (
  id: string,
  userId: string,
  updates: Partial<Omit<EmailSnippet, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<EmailSnippet | null> => {
  // Build dynamic query based on provided updates
  const keys = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
  
  if (keys.length === 0) {
    return getSnippetById(id, userId);
  }
  
  const setClauses = keys.map((key, index) => `${key} = $${index + 3}`);
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  
  const query = `
    UPDATE email_snippets 
    SET ${setClauses.join(', ')} 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const values = [id, userId, ...keys.map(key => updates[key as keyof typeof updates])];
  const result = await pool.query(query, values);
  
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Delete a snippet
 */
export const deleteSnippet = async (id: string, userId: string): Promise<boolean> => {
  const query = 'DELETE FROM email_snippets WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rowCount > 0;
};

/**
 * Apply template variables to content
 */
export const applyTemplateVariables = (
  content: string,
  variables: Record<string, string> = {}
): string => {
  let result = content;
  
  // Replace all variables in the format {variable_name}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};
