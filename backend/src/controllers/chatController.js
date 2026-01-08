/**
 * Chat Controller
 * Handles HTTP requests for chat and session endpoints
 */

const {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  getStats,
} = require('../models/conversationState');
const {
  processMessage,
  streamMessage,
  calculateMoodImprovement,
} = require('../services/conversationOrchestrator');
const { isConfigured } = require('../services/claudeService');

/**
 * POST /api/sessions/start
 * Create a new chat session
 */
async function startSession(req, res) {
  try {
    // Check if Claude API is configured
    if (!isConfigured()) {
      return res.status(503).json({
        error: true,
        message: 'Service not configured. Please contact administrator.',
      });
    }

    const { stressCategory, initialMood } = req.body;

    // Validation
    if (!stressCategory || !['work', 'academic'].includes(stressCategory)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid stress category. Must be "work" or "academic".',
      });
    }

    if (!initialMood || initialMood < 1 || initialMood > 10) {
      return res.status(400).json({
        error: true,
        message: 'Invalid mood level. Must be between 1 and 10.',
      });
    }

    // Create session
    const session = createSession(stressCategory, parseInt(initialMood));

    return res.status(201).json({
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      message: "Session created. Let's talk about what's on your mind.",
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to start session. Please try again.',
    });
  }
}

/**
 * POST /api/chat/message
 * Send a message and get response
 */
async function sendMessage(req, res) {
  try {
    const { sessionId, message } = req.body;

    // Validation
    if (!sessionId) {
      return res.status(400).json({
        error: true,
        message: 'Session ID is required.',
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Message cannot be empty.',
      });
    }

    // Limit message length
    const sanitizedMessage = message.trim().slice(0, 2000);

    // Process message
    const response = await processMessage(sessionId, sanitizedMessage);

    if (response.error) {
      return res.status(404).json(response);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error processing message:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to process message. Please try again.',
    });
  }
}

/**
 * GET /api/chat/stream/:sessionId
 * Stream message response for real-time feel
 */
async function streamResponse(req, res) {
  try {
    const { sessionId } = req.params;
    const { message } = req.query;

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Message cannot be empty.',
      });
    }

    const sanitizedMessage = message.trim().slice(0, 2000);

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get stream
    const result = await streamMessage(sessionId, sanitizedMessage);

    if (result.error) {
      res.write(`data: ${JSON.stringify({ error: true, message: result.message })}\n\n`);
      return res.end();
    }

    // Send metadata first
    res.write(`data: ${JSON.stringify({ type: 'metadata', ...result.metadata })}\n\n`);

    // Stream text chunks
    let fullMessage = '';
    for await (const chunk of result.stream) {
      fullMessage += chunk;
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ type: 'done', fullMessage })}\n\n`);
    res.end();

    // Add full message to session history
    const { addMessage } = require('../models/conversationState');
    addMessage(sessionId, 'assistant', fullMessage);
  } catch (error) {
    console.error('Error streaming response:', error);
    res.write(`data: ${JSON.stringify({ error: true, message: 'Stream error' })}\n\n`);
    res.end();
  }
}

/**
 * POST /api/sessions/end
 * End a session and calculate mood improvement
 */
async function endSession(req, res) {
  try {
    const { sessionId, finalMood } = req.body;

    // Validation
    if (!sessionId) {
      return res.status(400).json({
        error: true,
        message: 'Session ID is required.',
      });
    }

    if (!finalMood || finalMood < 1 || finalMood > 10) {
      return res.status(400).json({
        error: true,
        message: 'Invalid final mood. Must be between 1 and 10.',
      });
    }

    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: true,
        message: 'Session not found or expired.',
      });
    }

    // Calculate mood improvement
    const moodData = calculateMoodImprovement(
      session.initialMood,
      parseInt(finalMood)
    );

    // Update session with final mood
    updateSession(sessionId, { currentMood: parseInt(finalMood) });

    // Optional: Delete session immediately (true privacy)
    // deleteSession(sessionId);

    return res.status(200).json({
      ...moodData,
      sessionDuration: Math.round((Date.now() - session.createdAt) / 1000 / 60), // minutes
      messageCount: session.messageHistory.length,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to end session.',
    });
  }
}

/**
 * GET /api/health
 * Health check endpoint
 */
function healthCheck(req, res) {
  const stats = getStats();
  const isApiConfigured = isConfigured();

  return res.status(200).json({
    status: 'ok',
    apiConfigured: isApiConfigured,
    uptime: process.uptime(),
    ...stats,
  });
}

module.exports = {
  startSession,
  sendMessage,
  streamResponse,
  endSession,
  healthCheck,
};
