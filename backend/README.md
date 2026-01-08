# MindSpace Backend

Mental wellness chatbot API powered by Claude AI and Express.js.

## Features

- 🤖 **Claude AI Integration**: Natural, empathetic conversation using Anthropic's Claude
- 🔄 **Phase-Based Conversations**: Structured flow (check-in → exploration → intervention → closure)
- 🚨 **Crisis Detection**: Automatic detection of crisis keywords with resource escalation
- 💾 **In-Memory Sessions**: Anonymous, privacy-first session management (no data persistence)
- ⚡ **Streaming Responses**: Real-time message streaming for sub-2s perceived latency
- 🔒 **Privacy-First**: Truly anonymous, sessions auto-expire after 30 minutes

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your Anthropic API key:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from: https://console.anthropic.com/

### 3. Start the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

Server will run on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "apiConfigured": true,
  "uptime": 123.45,
  "totalActiveSessions": 2
}
```

### Start Session
```
POST /api/sessions/start
Content-Type: application/json

{
  "stressCategory": "work",  // "work" or "academic"
  "initialMood": 4            // 1-10
}
```

Response:
```json
{
  "sessionId": "uuid-string",
  "expiresAt": 1234567890,
  "message": "Session created. Let's talk about what's on your mind."
}
```

### Send Message
```
POST /api/chat/message
Content-Type: application/json

{
  "sessionId": "uuid-string",
  "message": "I'm feeling overwhelmed by work"
}
```

Response:
```json
{
  "reply": "I hear that you're feeling overwhelmed...",
  "sessionPhase": "exploration",
  "crisisDetected": false,
  "crisisInfo": null,
  "suggestedAction": null
}
```

### Stream Message (Real-time)
```
GET /api/chat/stream/:sessionId?message=Your+message+here
```

Returns Server-Sent Events (SSE) with chunks of Claude's response.

### End Session
```
POST /api/sessions/end
Content-Type: application/json

{
  "sessionId": "uuid-string",
  "finalMood": 7  // 1-10
}
```

Response:
```json
{
  "initialMood": 4,
  "finalMood": 7,
  "improvement": 3,
  "percentChange": "75.0",
  "message": "Great to see your mood improved by 3 points!",
  "sessionDuration": 8,
  "messageCount": 14
}
```

## Architecture

### Directory Structure

```
src/
├── config/
│   └── claude.js              # Claude API client configuration
├── models/
│   └── conversationState.js   # In-memory session storage
├── services/
│   ├── crisisDetector.js      # Crisis keyword detection
│   ├── promptBuilder.js       # Context-aware system prompts
│   ├── conversationOrchestrator.js  # Conversation flow logic
│   └── claudeService.js       # Claude API wrapper
├── controllers/
│   └── chatController.js      # HTTP request handlers
└── server.js                  # Express app entry point
```

### Conversation Phases

1. **check-in**: Initial understanding and rapport building
2. **exploration**: Deeper exploration with validation
3. **intervention**: CBT techniques and coping strategies
4. **closure**: Session wrap-up and mood reassessment

### Crisis Detection

The system automatically detects crisis keywords and displays resources:

**Immediate Keywords**: suicide, kill myself, end my life, hurt myself
**Concerning Keywords**: hopeless, no point, can't go on, worthless

**Resources Provided**:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- SAMHSA Helpline: 1-800-662-4357

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Start session
curl -X POST http://localhost:3001/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"stressCategory": "work", "initialMood": 4}'

# Send message
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "your-session-id", "message": "I feel stressed about my deadline"}'
```

## Configuration Options

All options are set via `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `ANTHROPIC_API_KEY` | - | Required: Your Anthropic API key |
| `CLAUDE_MODEL` | claude-3-5-sonnet-20241022 | Claude model to use |
| `MAX_TOKENS` | 1024 | Max tokens per response |
| `SESSION_EXPIRY_MINUTES` | 30 | Session expiry time |
| `CLEANUP_INTERVAL_MINUTES` | 5 | Session cleanup interval |
| `FRONTEND_URL` | http://localhost:5173 | Allowed CORS origin |

## Privacy & Security

- ✅ **No data persistence**: All sessions stored in memory, auto-deleted after expiry
- ✅ **Anonymous by design**: No user identification or authentication
- ✅ **Message limits**: User messages capped at 2000 characters
- ✅ **Session limits**: Each session stores max 20 messages
- ✅ **CORS protection**: Only configured frontend can access API
- ✅ **Input sanitization**: All user input is trimmed and validated

## Error Handling

The API gracefully handles:
- Invalid session IDs (404)
- Expired sessions (404)
- Missing required fields (400)
- Claude API errors (fallback responses)
- Rate limiting (429)
- Server errors (500)

## Performance

- **Response Time**: Sub-2-second perceived latency via streaming
- **Memory Management**: Automatic session cleanup every 5 minutes
- **Concurrency**: Supports multiple simultaneous sessions
- **Scalability**: In-memory storage suitable for MVP (migrate to Redis for scale)

## Development

### Adding New Conversation Phases

1. Add phase prompt to `src/services/promptBuilder.js`
2. Update phase transition logic in `src/services/conversationOrchestrator.js`

### Adding New Coping Techniques

1. Update `buildSystemPrompt()` in `promptBuilder.js`
2. Add action detection in `detectSuggestedAction()` in `conversationOrchestrator.js`

### Adding Crisis Keywords

Edit `CRISIS_KEYWORDS` in `src/services/crisisDetector.js`

## Troubleshooting

**"ANTHROPIC_API_KEY not set" warning**:
- Make sure `.env` file exists and contains your API key
- Verify the key starts with `sk-ant-`

**CORS errors from frontend**:
- Check `FRONTEND_URL` in `.env` matches your frontend URL
- Ensure frontend is running on the specified port

**Session not found errors**:
- Sessions expire after 30 minutes (configurable)
- Check session ID is being passed correctly
- Verify backend wasn't restarted (clears in-memory sessions)

## License

ISC

## Support

For issues or questions, please refer to the main project documentation.
