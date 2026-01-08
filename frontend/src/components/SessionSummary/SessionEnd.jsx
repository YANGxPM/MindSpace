/**
 * SessionEnd Component
 * Displays mood improvement and session summary
 */

import { useMemo } from 'react';
import './SessionEnd.css';

function SessionEnd({ initialMood, finalMood, onNewSession }) {
  const improvement = useMemo(() => {
    return finalMood - initialMood;
  }, [initialMood, finalMood]);

  const improvementPercentage = useMemo(() => {
    return Math.round((improvement / 10) * 100);
  }, [improvement]);

  const getMessage = () => {
    if (improvement >= 3) {
      return "That's wonderful progress! You've made significant strides in managing your stress.";
    } else if (improvement >= 1) {
      return "You've made positive progress! Every small step forward matters.";
    } else if (improvement === 0) {
      return "Thank you for taking time for yourself today. Remember, reaching out is a sign of strength.";
    } else {
      return "Thank you for sharing with me today. If you're feeling worse, please consider reaching out to a counselor or mental health professional.";
    }
  };

  const getImprovementColor = () => {
    if (improvement >= 3) return 'var(--secondary-500)';
    if (improvement >= 1) return 'var(--primary-500)';
    if (improvement === 0) return 'var(--neutral-500)';
    return 'var(--accent-warning)';
  };

  const getMoodEmoji = (mood) => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😟';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '🙂';
    return '😊';
  };

  return (
    <div className="session-end">
      <div className="session-end-content">
        <div className="session-end-header">
          <h2 className="session-end-title">Session Complete</h2>
          <p className="session-end-subtitle">Here's how you're doing</p>
        </div>

        <div className="mood-comparison">
          <div className="mood-comparison-item">
            <div className="mood-label">Starting Mood</div>
            <div className="mood-display">
              <span className="mood-emoji">{getMoodEmoji(initialMood)}</span>
              <span className="mood-value">{initialMood}/10</span>
            </div>
          </div>

          <div className="mood-arrow">→</div>

          <div className="mood-comparison-item">
            <div className="mood-label">Current Mood</div>
            <div className="mood-display">
              <span className="mood-emoji">{getMoodEmoji(finalMood)}</span>
              <span className="mood-value">{finalMood}/10</span>
            </div>
          </div>
        </div>

        <div className="improvement-display" style={{ color: getImprovementColor() }}>
          <div className="improvement-value">
            {improvement > 0 ? '+' : ''}{improvement}
          </div>
          <div className="improvement-label">
            {improvement > 0 ? 'Improvement' : improvement < 0 ? 'Change' : 'No Change'}
          </div>
        </div>

        <div className="session-end-message">
          <p>{getMessage()}</p>
        </div>

        <div className="session-end-tips">
          <h3 className="tips-title">Remember:</h3>
          <ul className="tips-list">
            <li>Progress isn't always linear - some days are harder than others</li>
            <li>The coping strategies we discussed can be used anytime</li>
            <li>Reaching out for support is a sign of strength, not weakness</li>
            <li>You deserve compassion, especially from yourself</li>
          </ul>
        </div>

        <div className="session-end-actions">
          <button
            className="session-end-button session-end-button-primary"
            onClick={onNewSession}
          >
            Start New Session
          </button>
        </div>

        <p className="session-end-footer">
          If you're in crisis or need immediate support, please reach out to a mental health professional or call 988 (Suicide & Crisis Lifeline).
        </p>
      </div>
    </div>
  );
}

export default SessionEnd;
