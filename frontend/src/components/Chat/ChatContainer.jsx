/**
 * ChatContainer Component
 * Main chat interface that brings together all chat components
 */

import { useEffect, useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../../hooks/useChat';
import './ChatContainer.css';

function ChatContainer({ sessionId, onCrisisDetected, onEndSession, onOpenBreathingExercise }) {
  const {
    messages,
    isTyping,
    error,
    crisisDetected,
    crisisInfo,
    suggestedAction,
    sendMessageStreaming,
  } = useChat(sessionId);

  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);

  // Notify parent when crisis detected
  useEffect(() => {
    if (crisisDetected && crisisInfo) {
      onCrisisDetected?.(crisisInfo);
    }
  }, [crisisDetected, crisisInfo, onCrisisDetected]);

  // Handle suggested actions from backend
  useEffect(() => {
    if (suggestedAction === 'breathing' && onOpenBreathingExercise) {
      onOpenBreathingExercise();
    }
  }, [suggestedAction, onOpenBreathingExercise]);

  const handleSendMessage = (text) => {
    sendMessageStreaming(text);
  };

  const handleEndSessionClick = () => {
    setShowEndSessionConfirm(true);
  };

  const handleConfirmEndSession = () => {
    // Prompt for final mood rating
    const finalMood = prompt('Before we end, how are you feeling now? (1-10)', '5');
    if (finalMood && onEndSession) {
      const moodValue = parseInt(finalMood);
      if (moodValue >= 1 && moodValue <= 10) {
        onEndSession(moodValue);
      }
    }
    setShowEndSessionConfirm(false);
  };

  const handleCancelEndSession = () => {
    setShowEndSessionConfirm(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-content">
          <h2 className="chat-title">MindSpace</h2>
          <p className="chat-subtitle">I'm here to listen and support you</p>
        </div>
        {onEndSession && (
          <button
            className="end-session-button"
            onClick={handleEndSessionClick}
            title="End session"
          >
            End Session
          </button>
        )}
      </div>

      <MessageList messages={messages} isTyping={isTyping} />

      {error && (
        <div className="chat-error">
          <p>{error}</p>
        </div>
      )}

      <MessageInput
        onSend={handleSendMessage}
        disabled={isTyping}
        placeholder={isTyping ? "MindSpace is typing..." : "Type your message..."}
      />

      {/* End Session Confirmation */}
      {showEndSessionConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">End Session?</h3>
            <p className="modal-message">
              Are you sure you want to end this session? We'll ask you to rate your current mood.
            </p>
            <div className="modal-actions">
              <button
                className="modal-button modal-button-secondary"
                onClick={handleCancelEndSession}
              >
                Cancel
              </button>
              <button
                className="modal-button modal-button-primary"
                onClick={handleConfirmEndSession}
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatContainer;
