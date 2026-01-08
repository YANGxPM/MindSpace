/**
 * MindSpace Backend Server
 * Express server for mental wellness chatbot
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatController = require('./controllers/chatController');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// API Routes

// Health check
app.get('/api/health', chatController.healthCheck);

// Session management
app.post('/api/sessions/start', chatController.startSession);
app.post('/api/sessions/end', chatController.endSession);

// Chat endpoints
app.post('/api/chat/message', chatController.sendMessage);
app.get('/api/chat/stream/:sessionId', chatController.streamResponse);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MindSpace API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      startSession: 'POST /api/sessions/start',
      endSession: 'POST /api/sessions/end',
      sendMessage: 'POST /api/chat/message',
      streamResponse: 'GET /api/chat/stream/:sessionId',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: true,
    message: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log('  MindSpace Backend Server');
  console.log('===========================================');
  console.log(`  🚀 Server running on port ${PORT}`);
  console.log(`  🌐 API available at http://localhost:${PORT}`);
  console.log(`  💚 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('===========================================');
  console.log('');

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not set!');
    console.warn('   Add your API key to .env file to use Claude API');
    console.log('');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
