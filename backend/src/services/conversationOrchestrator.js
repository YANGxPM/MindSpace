/**
 * Conversation Orchestrator
 * Manages conversation flow, phase transitions, and coordinates between services
 */

const { buildSystemPrompt } = require('./promptBuilder');
const { detectCrisis } = require('./crisisDetector');
const { callClaude, streamClaudeResponse } = require('./claudeService');
const {
  getSession,
  addMessage,
  getConversationHistory,
  updatePhase,
  markCrisisDetected,
} = require('../models/conversationState');

/**
 * Process a user message and generate response
 * @param {string} sessionId - Session ID
 * @param {string} userMessage - User's message
 * @returns {Promise<Object>} - Response object with reply, phase, crisis info, etc.
 */
async function processMessage(sessionId, userMessage) {
  // Get session
  const session = getSession(sessionId);
  if (!session) {
    return {
      error: true,
      message: 'Session not found or expired. Please start a new session.',
    };
  }

  // Check for crisis
  const crisisDetection = detectCrisis(userMessage);
  if (crisisDetection.detected && !session.crisisDetected) {
    markCrisisDetected(sessionId);
  }

  // Add user message to history
  addMessage(sessionId, 'user', userMessage);

  // Detect if phase should transition
  const newPhase = detectPhaseTransition(session);
  if (newPhase !== session.conversationPhase) {
    updatePhase(sessionId, newPhase);
    session.conversationPhase = newPhase;
  }

  // Build system prompt based on current state
  const systemPrompt = buildSystemPrompt(
    session.conversationPhase,
    session.stressCategory,
    session.currentMood
  );

  // Get conversation history for Claude
  const conversationHistory = getConversationHistory(sessionId, 10);

  // Call Claude
  const reply = await callClaude(systemPrompt, conversationHistory);

  // Add assistant reply to history
  addMessage(sessionId, 'assistant', reply);

  // Check if breathing exercise should be suggested
  const suggestedAction = detectSuggestedAction(reply);

  return {
    reply,
    sessionPhase: session.conversationPhase,
    crisisDetected: crisisDetection.detected,
    crisisInfo: crisisDetection.detected ? {
      isImmediate: crisisDetection.isImmediate,
      resources: crisisDetection.resources,
      message: crisisDetection.message,
    } : null,
    suggestedAction,
  };
}

/**
 * Stream a response for real-time feel
 * @param {string} sessionId - Session ID
 * @param {string} userMessage - User's message
 * @returns {Object} - Object with async generator and metadata
 */
async function streamMessage(sessionId, userMessage) {
  // Get session
  const session = getSession(sessionId);
  if (!session) {
    return {
      error: true,
      message: 'Session not found or expired.',
    };
  }

  // Check for crisis
  const crisisDetection = detectCrisis(userMessage);
  if (crisisDetection.detected && !session.crisisDetected) {
    markCrisisDetected(sessionId);
  }

  // Add user message
  addMessage(sessionId, 'user', userMessage);

  // Detect phase transition
  const newPhase = detectPhaseTransition(session);
  if (newPhase !== session.conversationPhase) {
    updatePhase(sessionId, newPhase);
    session.conversationPhase = newPhase;
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(
    session.conversationPhase,
    session.stressCategory,
    session.currentMood
  );

  // Get conversation history
  const conversationHistory = getConversationHistory(sessionId, 10);

  // Return stream generator and metadata
  return {
    stream: streamClaudeResponse(systemPrompt, conversationHistory),
    metadata: {
      sessionPhase: session.conversationPhase,
      crisisDetected: crisisDetection.detected,
      crisisInfo: crisisDetection.detected ? {
        isImmediate: crisisDetection.isImmediate,
        resources: crisisDetection.resources,
        message: crisisDetection.message,
      } : null,
    },
  };
}

/**
 * Detect when conversation should transition to next phase
 * @param {Object} session - Session object
 * @returns {string} - New phase
 */
function detectPhaseTransition(session) {
  const userMessages = session.messageHistory.filter(m => m.role === 'user').length;
  const currentPhase = session.conversationPhase;

  // Check-in → Exploration (after 2-3 exchanges)
  if (currentPhase === 'check-in' && userMessages >= 2) {
    return 'exploration';
  }

  // Exploration → Intervention (after 4-5 exchanges)
  if (currentPhase === 'exploration' && userMessages >= 4) {
    return 'intervention';
  }

  // Intervention → Closure (after 8-10 exchanges)
  if (currentPhase === 'intervention' && userMessages >= 8) {
    return 'closure';
  }

  return currentPhase;
}

/**
 * Detect if Claude's response suggests a specific action
 * @param {string} reply - Claude's reply
 * @returns {string|null} - Suggested action or null
 */
function detectSuggestedAction(reply) {
  const lowerReply = reply.toLowerCase();

  // Check for breathing exercise suggestion
  if (
    lowerReply.includes('breathing exercise') ||
    lowerReply.includes('breathing technique') ||
    lowerReply.includes('try breathing') ||
    (lowerReply.includes('breathe') && lowerReply.includes('help'))
  ) {
    return 'breathing';
  }

  // Check for grounding technique
  if (
    lowerReply.includes('5-4-3-2-1') ||
    lowerReply.includes('grounding technique')
  ) {
    return 'grounding';
  }

  return null;
}

/**
 * Calculate mood improvement for session end
 * @param {number} initialMood - Initial mood (1-10)
 * @param {number} finalMood - Final mood (1-10)
 * @returns {Object} - Mood improvement data
 */
function calculateMoodImprovement(initialMood, finalMood) {
  const improvement = finalMood - initialMood;
  const percentChange = ((improvement / initialMood) * 100).toFixed(1);

  let message = '';
  if (improvement > 0) {
    message = `Great to see your mood improved by ${improvement} points!`;
  } else if (improvement === 0) {
    message = 'Sometimes just talking helps, even if the number stays the same.';
  } else {
    message = "It's okay that your mood hasn't improved yet. These things take time.";
  }

  return {
    initialMood,
    finalMood,
    improvement,
    percentChange: improvement > 0 ? percentChange : null,
    message,
  };
}

module.exports = {
  processMessage,
  streamMessage,
  calculateMoodImprovement,
};
