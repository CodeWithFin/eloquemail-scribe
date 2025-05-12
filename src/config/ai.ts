// AI Service Configuration

// OpenAI configuration
export const openAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  defaultModel: 'gpt-3.5-turbo',
  defaultTemperature: 0.7,
  maxTokens: {
    short: 50,
    medium: 300,
    long: 500
  }
};

// Add more AI service configurations here as needed

// Export for use across the application
export default {
  openAI: openAIConfig
}; 