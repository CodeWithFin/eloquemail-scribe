import { v4 as uuidv4 } from 'uuid';

export interface EmailTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}

export interface EmailSnippet {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// Local storage keys
const TEMPLATES_STORAGE_KEY = 'email-buddy-templates';
const SNIPPETS_STORAGE_KEY = 'email-buddy-snippets';

// Default templates
const defaultTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Meeting Request',
    content: `Hi {name},

I hope this email finds you well. I'd like to schedule a meeting to discuss {topic}. Would you be available on {date} at {time}?

Let me know what works best for you.

Best regards,
{your_name}`,
    category: 'Business',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: 'Thank You',
    content: `Dear {name},

Thank you so much for {reason}. I really appreciate your {quality}.

Best wishes,
{your_name}`,
    category: 'Personal',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3',
    name: 'Follow-up Email',
    content: `Hello {name},

I'm following up on our conversation about {topic}. Have you had a chance to review the {document/proposal} I sent over?

I'm looking forward to your thoughts on this matter.

Regards,
{your_name}`,
    category: 'Business',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Default snippets
const defaultSnippets: EmailSnippet[] = [
  {
    id: '1',
    name: 'Professional Closing',
    content: 'Best regards,\n{your_name}',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: 'Meeting Availability',
    content: 'I am available on {day} between {start_time} and {end_time}.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3',
    name: 'Thank You Note',
    content: 'Thank you for your time and consideration.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Initialize storage with default templates if empty
const initializeStorage = () => {
  const templatesString = localStorage.getItem(TEMPLATES_STORAGE_KEY);
  if (!templatesString) {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(defaultTemplates));
  }

  const snippetsString = localStorage.getItem(SNIPPETS_STORAGE_KEY);
  if (!snippetsString) {
    localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(defaultSnippets));
  }
};

// Template functions
export const getTemplates = (): EmailTemplate[] => {
  initializeStorage();
  const templates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
  return templates ? JSON.parse(templates) : [];
};

export const getTemplateById = (id: string): EmailTemplate | undefined => {
  const templates = getTemplates();
  return templates.find((template) => template.id === id);
};

export const createTemplate = (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate => {
  const templates = getTemplates();
  const now = Date.now();
  const newTemplate: EmailTemplate = {
    ...template,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify([...templates, newTemplate]));
  return newTemplate;
};

export const updateTemplate = (id: string, updates: Partial<Omit<EmailTemplate, 'id' | 'createdAt'>>): EmailTemplate => {
  const templates = getTemplates();
  const templateIndex = templates.findIndex((t) => t.id === id);
  
  if (templateIndex === -1) {
    throw new Error(`Template with ID ${id} not found`);
  }

  const updatedTemplate = {
    ...templates[templateIndex],
    ...updates,
    updatedAt: Date.now(),
  };

  templates[templateIndex] = updatedTemplate;
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  return updatedTemplate;
};

export const deleteTemplate = (id: string): void => {
  const templates = getTemplates();
  const filteredTemplates = templates.filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filteredTemplates));
};

// Snippet functions
export const getSnippets = (): EmailSnippet[] => {
  initializeStorage();
  const snippets = localStorage.getItem(SNIPPETS_STORAGE_KEY);
  return snippets ? JSON.parse(snippets) : [];
};

export const getSnippetById = (id: string): EmailSnippet | undefined => {
  const snippets = getSnippets();
  return snippets.find((snippet) => snippet.id === id);
};

export const createSnippet = (snippet: Omit<EmailSnippet, 'id' | 'createdAt' | 'updatedAt'>): EmailSnippet => {
  const snippets = getSnippets();
  const now = Date.now();
  const newSnippet: EmailSnippet = {
    ...snippet,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify([...snippets, newSnippet]));
  return newSnippet;
};

export const updateSnippet = (id: string, updates: Partial<Omit<EmailSnippet, 'id' | 'createdAt'>>): EmailSnippet => {
  const snippets = getSnippets();
  const snippetIndex = snippets.findIndex((s) => s.id === id);
  
  if (snippetIndex === -1) {
    throw new Error(`Snippet with ID ${id} not found`);
  }

  const updatedSnippet = {
    ...snippets[snippetIndex],
    ...updates,
    updatedAt: Date.now(),
  };

  snippets[snippetIndex] = updatedSnippet;
  localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(snippets));
  return updatedSnippet;
};

export const deleteSnippet = (id: string): void => {
  const snippets = getSnippets();
  const filteredSnippets = snippets.filter((s) => s.id !== id);
  localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(filteredSnippets));
};

// Template variable replacement
export const applyTemplateVariables = (
  content: string,
  variables: Record<string, string> = {}
): string => {
  let result = content;
  
  // Replace all variables in the format {variable_name}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};
