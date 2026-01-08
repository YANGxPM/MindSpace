/**
 * MindSpace - Mental Wellness Chatbot
 * Main application component
 */

import { useState, useCallback } from 'react';
import './App.css';

// Import custom hooks
import { useSession } from './hooks/useSession';
import { useMoodTracking } from './hooks/useMoodTracking';

// Import components
import MoodCheckIn from './components/Onboarding/MoodCheckIn';
import ChatContainer from './components/Chat/ChatContainer';
import CrisisAlert from './components/CrisisResources/CrisisAlert';
import BreathingExercise from './components/Interventions/BreathingExercise';
import SessionEnd from './components/SessionSummary/SessionEnd';

function App() {
  // Application state
  const [appState, setAppState] = useState('onboarding'); // 'onboarding' | 'chatting' | 'session-end'
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [crisisInfo, setCrisisInfo] = useState(null);

  // Custom hooks
  const {
    sessionId,
    stressCategory,
    initialMood,
    isLoading: sessionLoading,
    error: sessionError,
    startSession,
    endSession,
    clearSession,
    hasSession,
  } = useSession();

  const {
    currentMood,
    updateMood,
    getMoodImprovement,
    resetMoodTracking,
    initialMood: trackedInitialMood,
    finalMood,
  } = useMoodTracking();

  // Handle starting a new session from onboarding
  const handleStartSession = useCallback(
    async (category, mood) => {
      try {
        await startSession(category, mood);
        updateMood(mood); // Initialize mood tracking
        setAppState('chatting');
      } catch (error) {
        console.error('Failed to start session:', error);
        // Error will be handled by useSession hook
      }
    },
    [startSession, updateMood]
  );

  // Handle crisis detection from chat
  const handleCrisisDetected = useCallback((crisis) => {
    setCrisisInfo(crisis);
  }, []);

  // Handle ending the current session
  const handleEndSession = useCallback(
    async (mood) => {
      updateMood(mood); // Update final mood
      try {
        await endSession(sessionId, mood);
        setAppState('session-end');
      } catch (error) {
        console.error('Failed to end session:', error);
        // Still show session end screen even if API call fails
        setAppState('session-end');
      }
    },
    [endSession, sessionId, updateMood]
  );

  // Handle starting a new session from session end
  const handleNewSession = useCallback(() => {
    clearSession();
    resetMoodTracking();
    setCrisisInfo(null);
    setShowBreathingExercise(false);
    setAppState('onboarding');
  }, [clearSession, resetMoodTracking]);

  // Handle opening breathing exercise
  const handleOpenBreathingExercise = useCallback(() => {
    setShowBreathingExercise(true);
  }, []);

  // Handle closing breathing exercise
  const handleCloseBreathingExercise = useCallback(() => {
    setShowBreathingExercise(false);
  }, []);

  // Render based on app state
  return (
    <div className="app">
      {/* Crisis Alert Banner (persists across all states if detected) */}
      {crisisInfo && <CrisisAlert crisisInfo={crisisInfo} />}

      {/* Main Content */}
      {appState === 'onboarding' && (
        <MoodCheckIn
          onStart={handleStartSession}
          isLoading={sessionLoading}
          error={sessionError}
        />
      )}

      {appState === 'chatting' && sessionId && (
        <ChatContainer
          sessionId={sessionId}
          onCrisisDetected={handleCrisisDetected}
          onEndSession={handleEndSession}
          onOpenBreathingExercise={handleOpenBreathingExercise}
        />
      )}

      {appState === 'session-end' && (
        <SessionEnd
          initialMood={trackedInitialMood || initialMood}
          finalMood={finalMood || currentMood}
          onNewSession={handleNewSession}
        />
      )}

      {/* Breathing Exercise Overlay */}
      {showBreathingExercise && (
        <BreathingExercise onClose={handleCloseBreathingExercise} />
      )}
    </div>
  );
}

export default App;
