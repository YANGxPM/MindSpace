/**
 * useChat Hook
 * Manages chat messages and communication with backend
 */

import { useState, useCallback, useRef } from 'react';
import { sendMessage as apiSendMessage, streamMessage as apiStreamMessage } from '../services/api';

export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisInfo, setCrisisInfo] = useState(null);
  const [suggestedAction, setSuggestedAction] = useState(null);
  const [sessionPhase, setSessionPhase] = useState('check-in');

  const streamCloseRef = useRef(null);
  const messageIdCounter = useRef(0);

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    return `msg-${Date.now()}-${messageIdCounter.current++}`;
  }, []);

  // Add a message to the chat
  const addMessage = useCallback((role, content, streaming = false) => {
    const message = {
      id: generateMessageId(),
      role, // 'user' or 'assistant'
      content,
      timestamp: Date.now(),
      streaming,
    };

    setMessages((prev) => [...prev, message]);
    return message.id;
  }, [generateMessageId]);

  // Update a message's content (for streaming)
  const updateMessage = useCallback((messageId, content, streaming = false) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content, streaming }
          : msg
      )
    );
  }, []);

  // Send a message (non-streaming)
  const sendMessage = useCallback(async (text) => {
    if (!sessionId) {
      throw new Error('No active session');
    }

    if (!text || text.trim().length === 0) {
      return;
    }

    const sanitized = text.trim().slice(0, 2000);
    setError(null);

    // Add user message immediately
    addMessage('user', sanitized);

    // Show typing indicator
    setIsTyping(true);

    try {
      const response = await apiSendMessage(sessionId, sanitized);

      // Add assistant response
      addMessage('assistant', response.reply);

      // Update metadata
      setSessionPhase(response.sessionPhase);
      setCrisisDetected(response.crisisDetected);
      setCrisisInfo(response.crisisInfo);
      setSuggestedAction(response.suggestedAction);

      return response;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);

      // Add error message
      addMessage('assistant', 'I apologize, I\'m having trouble responding right now. Could you try again?');

      throw err;
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, addMessage]);

  // Send a message with streaming response
  const sendMessageStreaming = useCallback((text) => {
    if (!sessionId) {
      throw new Error('No active session');
    }

    if (!text || text.trim().length === 0) {
      return;
    }

    const sanitized = text.trim().slice(0, 2000);
    setError(null);

    // Add user message immediately
    addMessage('user', sanitized);

    // Show typing indicator initially
    setIsTyping(true);

    // Prepare for assistant message
    let assistantMessageId = null;
    let fullMessage = '';

    // Start streaming
    const closeStream = apiStreamMessage(sessionId, sanitized, {
      onMetadata: (metadata) => {
        // Update metadata
        setSessionPhase(metadata.sessionPhase);
        setCrisisDetected(metadata.crisisDetected);
        setCrisisInfo(metadata.crisisInfo);
        setIsTyping(false);

        // Create assistant message
        assistantMessageId = addMessage('assistant', '', true);
      },

      onChunk: (chunk) => {
        fullMessage += chunk;
        if (assistantMessageId) {
          updateMessage(assistantMessageId, fullMessage, true);
        }
      },

      onDone: (finalMessage) => {
        setIsTyping(false);
        if (assistantMessageId) {
          updateMessage(assistantMessageId, finalMessage || fullMessage, false);
        }
      },

      onError: (err) => {
        console.error('Streaming error:', err);
        setError(err.message);
        setIsTyping(false);

        if (!assistantMessageId) {
          addMessage('assistant', 'I apologize, I\'m having trouble responding right now. Could you try again?');
        }
      },
    });

    // Store close function
    streamCloseRef.current = closeStream;
  }, [sessionId, addMessage, updateMessage]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (streamCloseRef.current) {
      streamCloseRef.current();
      streamCloseRef.current = null;
      setIsTyping(false);
    }
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCrisisDetected(false);
    setCrisisInfo(null);
    setSuggestedAction(null);
    setSessionPhase('check-in');
    setError(null);
  }, []);

  // Clear crisis alert
  const clearCrisisAlert = useCallback(() => {
    setCrisisDetected(false);
    setCrisisInfo(null);
  }, []);

  return {
    messages,
    isTyping,
    error,
    crisisDetected,
    crisisInfo,
    suggestedAction,
    sessionPhase,
    sendMessage,
    sendMessageStreaming,
    stopStreaming,
    clearMessages,
    clearCrisisAlert,
    addMessage, // Expose for manual use if needed
  };
}
