/**
 * Claude Service
 * Handles API calls to Claude with error handling, retries, and streaming support
 */

const { anthropic, CLAUDE_CONFIG } = require('../config/claude');

/**
 * Call Claude API with system prompt and messages
 * @param {string} systemPrompt - System prompt for Claude
 * @param {Array} messages - Conversation history
 * @returns {Promise<string>} - Claude's response
 */
async function callClaude(systemPrompt, messages) {
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature: CLAUDE_CONFIG.temperature,
      system: systemPrompt,
      messages: messages,
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    return textContent ? textContent.text : '';
  } catch (error) {
    return handleClaudeError(error);
  }
}

/**
 * Stream Claude API response for real-time feel
 * @param {string} systemPrompt - System prompt
 * @param {Array} messages - Conversation history
 * @returns {AsyncGenerator} - Async generator yielding text chunks
 */
async function* streamClaudeResponse(systemPrompt, messages) {
  try {
    const stream = await anthropic.messages.create({
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature: CLAUDE_CONFIG.temperature,
      system: systemPrompt,
      messages: messages,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  } catch (error) {
    const fallbackMessage = handleClaudeError(error);
    yield fallbackMessage;
  }
}

/**
 * Handle Claude API errors with graceful fallbacks
 * @param {Error} error - Error object
 * @returns {string} - Fallback message
 */
function handleClaudeError(error) {
  console.error('Claude API Error:', error);
  console.error('Error details:', {
    message: error.message,
    status: error.status,
    type: error.type,
    error: error.error,
  });

  if (error.status === 429) {
    // Rate limit
    return "I'm experiencing high demand right now. Could you try saying that again in a moment?";
  }

  if (error.status === 500 || error.status === 529) {
    // Server error
    return "I'm having trouble connecting right now. Take a deep breath - would you like to try rephrasing that?";
  }

  if (error.status === 401 || error.status === 403) {
    // API key issue
    console.error('CRITICAL: Invalid API key - check .env file');
    return "I'm experiencing a configuration issue. Please contact support.";
  }

  if (error.status === 400) {
    // Bad request - likely invalid message format
    console.error('CRITICAL: Bad request - check message format');
    console.error('Full error:', JSON.stringify(error, null, 2));
    return "I'm having trouble understanding that message format. Could you try rephrasing?";
  }

  if (error.status === 404) {
    // Model not found
    console.error('CRITICAL: Model not found - check CLAUDE_MODEL in .env file');
    console.error('Requested model:', error.error?.error?.message || 'unknown');
    return "I'm experiencing a configuration issue with the AI model. Please contact support.";
  }

  // Generic fallback with more error info
  console.error('Unhandled error type - falling back to generic message');
  return "I'm having a momentary issue. Could you try that again?";
}

/**
 * Check if API key is configured
 * @returns {boolean} - True if API key exists
 */
function isConfigured() {
  return !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 0;
}

module.exports = {
  callClaude,
  streamClaudeResponse,
  isConfigured,
};
