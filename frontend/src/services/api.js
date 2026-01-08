/**
 * API Client Service
 * Handles all communication with MindSpace backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Start a new chat session
 * @param {string} stressCategory - 'work' or 'academic'
 * @param {number} initialMood - Mood score (1-10)
 * @returns {Promise<Object>} - { sessionId, expiresAt, message }
 */
export async function startSession(stressCategory, initialMood) {
  return apiCall('/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ stressCategory, initialMood }),
  });
}

/**
 * Send a message in the chat
 * @param {string} sessionId - Session ID
 * @param {string} message - User's message
 * @returns {Promise<Object>} - { reply, sessionPhase, crisisDetected, crisisInfo, suggestedAction }
 */
export async function sendMessage(sessionId, message) {
  return apiCall('/chat/message', {
    method: 'POST',
    body: JSON.stringify({ sessionId, message }),
  });
}

/**
 * Stream a message response (Server-Sent Events)
 * @param {string} sessionId - Session ID
 * @param {string} message - User's message
 * @param {Function} onChunk - Callback for each text chunk
 * @param {Function} onMetadata - Callback for metadata
 * @param {Function} onDone - Callback when stream completes
 * @param {Function} onError - Callback for errors
 */
export function streamMessage(sessionId, message, { onChunk, onMetadata, onDone, onError }) {
  const url = `${API_BASE_URL}/chat/stream/${sessionId}?message=${encodeURIComponent(message)}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.error) {
        onError?.(new Error(data.message));
        eventSource.close();
        return;
      }

      if (data.type === 'metadata') {
        onMetadata?.(data);
      } else if (data.type === 'chunk') {
        onChunk?.(data.text);
      } else if (data.type === 'done') {
        onDone?.(data.fullMessage);
        eventSource.close();
      }
    } catch (error) {
      console.error('Error parsing SSE data:', error);
      onError?.(error);
      eventSource.close();
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    onError?.(new Error('Connection error. Please try again.'));
    eventSource.close();
  };

  // Return close function
  return () => eventSource.close();
}

/**
 * End a chat session
 * @param {string} sessionId - Session ID
 * @param {number} finalMood - Final mood score (1-10)
 * @returns {Promise<Object>} - { initialMood, finalMood, improvement, message, sessionDuration, messageCount }
 */
export async function endSession(sessionId, finalMood) {
  return apiCall('/sessions/end', {
    method: 'POST',
    body: JSON.stringify({ sessionId, finalMood }),
  });
}

/**
 * Health check
 * @returns {Promise<Object>} - { status, apiConfigured, uptime, totalActiveSessions }
 */
export async function healthCheck() {
  return apiCall('/health');
}

/**
 * Error handling helper
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
export function getErrorMessage(error) {
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection.';
  }

  if (error.message.includes('fetch')) {
    return 'Unable to connect to the server. Please try again.';
  }

  return error.message || 'Something went wrong. Please try again.';
}
