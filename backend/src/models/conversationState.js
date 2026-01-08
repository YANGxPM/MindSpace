/**
 * Conversation State Management
 * In-memory storage for anonymous chat sessions with automatic cleanup
 */

const { v4: uuidv4 } = require('uuid');

// In-memory storage for sessions
const sessions = new Map();

// Configuration
const SESSION_EXPIRY_MINUTES = parseInt(process.env.SESSION_EXPIRY_MINUTES) || 30;
const CLEANUP_INTERVAL_MINUTES = parseInt(process.env.CLEANUP_INTERVAL_MINUTES) || 5;

/**
 * Create a new session
 * @param {string} stressCategory - Type of stress (work or academic)
 * @param {number} initialMood - Initial mood score (1-10)
 * @returns {Object} - New session object
 */
function createSession(stressCategory, initialMood) {
  const sessionId = uuidv4();
  const now = Date.now();
  const expiresAt = now + SESSION_EXPIRY_MINUTES * 60 * 1000;

  const session = {
    sessionId,
    createdAt: now,
    expiresAt,
    lastActivity: now,
    conversationPhase: 'check-in',
    stressCategory,
    initialMood,
    currentMood: initialMood,
    messageHistory: [],
    crisisDetected: false,
    interventionsUsed: [],
  };

  sessions.set(sessionId, session);
  console.log(`Session created: ${sessionId} (expires in ${SESSION_EXPIRY_MINUTES} min)`);

  return session;
}

/**
 * Get a session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - Session object or null if not found/expired
 */
function getSession(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    console.log(`Session expired: ${sessionId}`);
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

/**
 * Update a session
 * @param {string} sessionId - Session ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated session or null if not found
 */
function updateSession(sessionId, updates) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  // Extend expiry on activity (sliding window)
  const newExpiresAt = Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000;

  const updatedSession = {
    ...session,
    ...updates,
    lastActivity: Date.now(),
    expiresAt: newExpiresAt,
  };

  sessions.set(sessionId, updatedSession);
  return updatedSession;
}

/**
 * Add a message to session history
 * @param {string} sessionId - Session ID
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 * @returns {Object|null} - Updated session or null if not found
 */
function addMessage(sessionId, role, content) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  const message = {
    role,
    content,
    timestamp: Date.now(),
  };

  session.messageHistory.push(message);

  // Keep only last 20 messages to prevent memory bloat
  if (session.messageHistory.length > 20) {
    session.messageHistory = session.messageHistory.slice(-20);
  }

  return updateSession(sessionId, { messageHistory: session.messageHistory });
}

/**
 * Get conversation history for Claude API (last N messages)
 * @param {string} sessionId - Session ID
 * @param {number} limit - Max number of messages to return
 * @returns {Array} - Array of messages in Claude API format
 */
function getConversationHistory(sessionId, limit = 10) {
  const session = getSession(sessionId);

  if (!session) {
    return [];
  }

  // Get last N messages
  const recentMessages = session.messageHistory.slice(-limit);

  // Format for Claude API (role and content only)
  return recentMessages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Update conversation phase
 * @param {string} sessionId - Session ID
 * @param {string} newPhase - New phase
 * @returns {Object|null} - Updated session or null if not found
 */
function updatePhase(sessionId, newPhase) {
  console.log(`Session ${sessionId}: phase transition to ${newPhase}`);
  return updateSession(sessionId, { conversationPhase: newPhase });
}

/**
 * Mark crisis detected
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - Updated session or null if not found
 */
function markCrisisDetected(sessionId) {
  console.warn(`CRISIS DETECTED in session: ${sessionId}`);
  return updateSession(sessionId, { crisisDetected: true });
}

/**
 * Delete a session
 * @param {string} sessionId - Session ID
 */
function deleteSession(sessionId) {
  sessions.delete(sessionId);
  console.log(`Session deleted: ${sessionId}`);
}

/**
 * Clean up expired sessions
 * Removes sessions that have passed their expiry time
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleanup: Removed ${cleanedCount} expired session(s)`);
  }

  return cleanedCount;
}

/**
 * Get session statistics (for monitoring)
 * @returns {Object} - Stats about current sessions
 */
function getStats() {
  return {
    totalActiveSessions: sessions.size,
    timestamp: new Date().toISOString(),
  };
}

// Start automatic cleanup job
const cleanupInterval = setInterval(() => {
  cleanupExpiredSessions();
}, CLEANUP_INTERVAL_MINUTES * 60 * 1000);

// Cleanup on process exit
process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
  console.log('\nCleaning up sessions before exit...');
  sessions.clear();
  process.exit(0);
});

console.log(`Session store initialized (expiry: ${SESSION_EXPIRY_MINUTES}min, cleanup: ${CLEANUP_INTERVAL_MINUTES}min)`);

module.exports = {
  createSession,
  getSession,
  updateSession,
  addMessage,
  getConversationHistory,
  updatePhase,
  markCrisisDetected,
  deleteSession,
  cleanupExpiredSessions,
  getStats,
};
