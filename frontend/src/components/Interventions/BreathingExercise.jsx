/**
 * BreathingExercise Component
 * Guided breathing exercise with animated circle
 */

import { useState, useEffect, useRef } from 'react';
import './BreathingExercise.css';

const BREATHING_PHASES = [
  { name: 'Breathe In', duration: 4000, animation: 'breathe-in' },
  { name: 'Hold', duration: 4000, animation: 'hold' },
  { name: 'Breathe Out', duration: 6000, animation: 'breathe-out' },
];

function BreathingExercise({ onClose }) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [cycleCount, setCycleCount] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPaused || isComplete) return;

    const phase = BREATHING_PHASES[currentPhase];

    timerRef.current = setTimeout(() => {
      const nextPhase = (currentPhase + 1) % BREATHING_PHASES.length;

      if (nextPhase === 0) {
        // Completed a full cycle
        if (cycleCount >= 3) {
          setIsComplete(true);
        } else {
          setCurrentPhase(nextPhase);
          setCycleCount((prev) => prev + 1);
        }
      } else {
        setCurrentPhase(nextPhase);
      }
    }, phase.duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentPhase, cycleCount, isPaused, isComplete]);

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleRestart = () => {
    setCurrentPhase(0);
    setCycleCount(1);
    setIsPaused(false);
    setIsComplete(false);
  };

  const phase = BREATHING_PHASES[currentPhase];

  return (
    <div className="breathing-exercise">
      <div className="breathing-content">
        <h3 className="breathing-title">Breathing Exercise</h3>
        <p className="breathing-subtitle">Follow the circle and breathe</p>

        <div className="breathing-circle-container">
          <div className={`breathing-circle ${!isPaused && !isComplete ? phase.animation : ''}`}>
            {!isComplete && (
              <>
                <div className="breathing-phase-text">{phase.name}</div>
                <div className="breathing-cycle-text">Cycle {cycleCount}/3</div>
              </>
            )}
            {isComplete && (
              <div className="breathing-complete-text">
                <div>✓</div>
                <div>Complete!</div>
              </div>
            )}
          </div>
        </div>

        <div className="breathing-controls">
          {!isComplete && (
            <button
              className="breathing-button breathing-button-secondary"
              onClick={handlePauseResume}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}

          {isComplete && (
            <button
              className="breathing-button breathing-button-secondary"
              onClick={handleRestart}
            >
              Do Again
            </button>
          )}

          <button
            className="breathing-button breathing-button-primary"
            onClick={onClose}
          >
            {isComplete ? 'Done' : 'Close'}
          </button>
        </div>

        {isComplete && (
          <p className="breathing-complete-message">
            Great job! How do you feel now?
          </p>
        )}
      </div>
    </div>
  );
}

export default BreathingExercise;
