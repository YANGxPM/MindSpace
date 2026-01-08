const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuration constants
const CLAUDE_CONFIG = {
  model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
  maxTokens: parseInt(process.env.MAX_TOKENS) || 1024,
  temperature: 1.0, // Full creativity for empathetic responses
};

// Validate API key on startup
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set in .env file');
  console.error('Please add your API key to the .env file to use Claude API');
}

module.exports = {
  anthropic,
  CLAUDE_CONFIG,
};
