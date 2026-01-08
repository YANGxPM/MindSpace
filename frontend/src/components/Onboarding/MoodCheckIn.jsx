/**
 * MoodCheckIn Component
 * Initial mood assessment and stress category selection
 */

import { useState } from 'react';
import './MoodCheckIn.css';

function MoodCheckIn({ onStart, isLoading, error: externalError }) {
  const [mood, setMood] = useState(5);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const moodEmojis = {
    1: '😢', 2: '😢', 3: '😔', 4: '😔',
    5: '😐', 6: '😐', 7: '🙂', 8: '🙂',
    9: '😊', 10: '😊'
  };

  const moodLabels = {
    1: 'Very Low', 2: 'Very Low', 3: 'Low', 4: 'Low',
    5: 'Moderate', 6: 'Moderate', 7: 'Good', 8: 'Good',
    9: 'Great', 10: 'Great'
  };

  const handleStart = () => {
    if (!category) {
      setError('Please select what type of stress you\'re experiencing');
      return;
    }

    onStart(category, mood);
  };

  return (
    <div className="mood-checkin">
      <div className="mood-checkin-content">
        <h1 className="mood-checkin-title">Welcome to MindSpace</h1>
        <p className="mood-checkin-subtitle">
          Let's talk about what's on your mind. I'm here to listen and support you.
        </p>

        {/* Mood Slider */}
        <div className="mood-section">
          <label className="mood-label">
            How are you feeling right now?
          </label>

          <div className="mood-display">
            <span className="mood-emoji">{moodEmojis[mood]}</span>
            <span className="mood-value">{mood}/10</span>
            <span className="mood-text">{moodLabels[mood]}</span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            value={mood}
            onChange={(e) => setMood(parseInt(e.target.value))}
            className="mood-slider"
          />

          <div className="mood-scale">
            <span>Very Low</span>
            <span>Great</span>
          </div>
        </div>

        {/* Category Selection */}
        <div className="category-section">
          <label className="category-label">
            What's bringing you here today?
          </label>

          <div className="category-buttons">
            <button
              className={`category-button ${category === 'academic' ? 'active' : ''}`}
              onClick={() => {
                setCategory('academic');
                setError('');
              }}
            >
              <span className="category-icon">📚</span>
              <span className="category-title">Academic Stress</span>
              <span className="category-desc">Exams, assignments, grades</span>
            </button>

            <button
              className={`category-button ${category === 'work' ? 'active' : ''}`}
              onClick={() => {
                setCategory('work');
                setError('');
              }}
            >
              <span className="category-icon">💼</span>
              <span className="category-title">Work Stress</span>
              <span className="category-desc">Projects, deadlines, workplace</span>
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}
          {externalError && <p className="error-message">{externalError}</p>}
        </div>

        {/* Start Button */}
        <button
          className="start-button"
          onClick={handleStart}
          disabled={!category || isLoading}
        >
          {isLoading ? 'Starting...' : 'Start Chat'}
        </button>

        {/* Privacy Note */}
        <p className="privacy-note">
          🔒 Completely anonymous • No sign-up required • Available 24/7
        </p>
      </div>
    </div>
  );
}

export default MoodCheckIn;
