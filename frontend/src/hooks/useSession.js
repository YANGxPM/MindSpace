/**
 * useSession Hook
 * Manages session lifecycle and storage
 */

import { useState, useEffect, useCallback } from 'react';
import { startSession as apiStartSession, endSession as apiEndSession } from '../services/api';

const SESSION_STORAGE_KEY = 'mindspace_session';
const SESSION_EXPIRY_MINUTES = 30;

export function useSession() {
  const [sessionId, setSessionId] = useState(null);
  const [stressCategory, setStressCategory] = useState(null);
  const [initialMood, setInitialMood] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load session from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);

        // Check if session is expired
        if (Date.now() < session.expiresAt) {
          setSessionId(session.sessionId);
          setStressCategory(session.stressCategory);
          setInitialMood(session.initialMood);
          setExpiresAt(session.expiresAt);
        } else {
          // Session expired, clear it
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (err) {
        console.error('Error loading session:', err);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // Save session to sessionStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      const session = {
        sessionId,
        stressCategory,
        initialMood,
        expiresAt,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }, [sessionId, stressCategory, initialMood, expiresAt]);

  // Start a new session
  const startSession = useCallback(async (category, mood) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiStartSession(category, mood);

      setSessionId(response.sessionId);
      setStressCategory(category);
      setInitialMood(mood);
      setExpiresAt(response.expiresAt);

      return response;
    } catch (err) {
      console.error('Error starting session:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // End the current session
  const endSession = useCallback(async (finalMood) => {
    if (!sessionId) {
      throw new Error('No active session');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiEndSession(sessionId, finalMood);

      // Clear session
      setSessionId(null);
      setStressCategory(null);
      setInitialMood(null);
      setExpiresAt(null);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);

      return response;
    } catch (err) {
      console.error('Error ending session:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Clear session (without API call)
  const clearSession = useCallback(() => {
    setSessionId(null);
    setStressCategory(null);
    setInitialMood(null);
    setExpiresAt(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  // Check if session is valid
  const isSessionValid = useCallback(() => {
    return sessionId && expiresAt && Date.now() < expiresAt;
  }, [sessionId, expiresAt]);

  return {
    sessionId,
    stressCategory,
    initialMood,
    expiresAt,
    isLoading,
    error,
    startSession,
    endSession,
    clearSession,
    isSessionValid,
    hasSession: !!sessionId,
  };
}
