/**
 * useMoodTracking Hook
 * Tracks mood scores and calculates improvement
 */

import { useState, useCallback } from 'react';

export function useMoodTracking(initialMood = null) {
  const [currentMood, setCurrentMood] = useState(initialMood);
  const [moodHistory, setMoodHistory] = useState(
    initialMood ? [{ mood: initialMood, timestamp: Date.now() }] : []
  );

  // Update current mood
  const updateMood = useCallback((newMood) => {
    setCurrentMood(newMood);
    setMoodHistory((prev) => [
      ...prev,
      { mood: newMood, timestamp: Date.now() },
    ]);
  }, []);

  // Calculate mood improvement
  const getMoodImprovement = useCallback(() => {
    if (moodHistory.length < 2) {
      return null;
    }

    const initial = moodHistory[0].mood;
    const final = moodHistory[moodHistory.length - 1].mood;
    return final - initial;
  }, [moodHistory]);

  // Get mood improvement percentage
  const getMoodImprovementPercentage = useCallback(() => {
    if (moodHistory.length < 2) {
      return null;
    }

    const initial = moodHistory[0].mood;
    const final = moodHistory[moodHistory.length - 1].mood;
    const improvement = final - initial;

    if (initial === 0) return null;

    return ((improvement / initial) * 100).toFixed(1);
  }, [moodHistory]);

  // Get improvement message
  const getImprovementMessage = useCallback(() => {
    const improvement = getMoodImprovement();

    if (improvement === null) {
      return null;
    }

    if (improvement > 0) {
      return `Great to see your mood improved by ${improvement} points!`;
    } else if (improvement === 0) {
      return 'Sometimes just talking helps, even if the number stays the same.';
    } else {
      return "It's okay that your mood hasn't improved yet. These things take time.";
    }
  }, [getMoodImprovement]);

  // Reset mood tracking
  const resetMoodTracking = useCallback(() => {
    setCurrentMood(null);
    setMoodHistory([]);
  }, []);

  // Get mood emoji
  const getMoodEmoji = useCallback((mood) => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😔';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '🙂';
    return '😊';
  }, []);

  // Get mood label
  const getMoodLabel = useCallback((mood) => {
    if (mood <= 2) return 'Very Low';
    if (mood <= 4) return 'Low';
    if (mood <= 6) return 'Moderate';
    if (mood <= 8) return 'Good';
    return 'Great';
  }, []);

  // Get mood color
  const getMoodColor = useCallback((mood) => {
    if (mood <= 2) return '#EF5350'; // Red
    if (mood <= 4) return '#FF9800'; // Orange
    if (mood <= 6) return '#FFC107'; // Amber
    if (mood <= 8) return '#8BC34A'; // Light Green
    return '#4CAF50'; // Green
  }, []);

  return {
    currentMood,
    moodHistory,
    updateMood,
    getMoodImprovement,
    getMoodImprovementPercentage,
    getImprovementMessage,
    resetMoodTracking,
    getMoodEmoji,
    getMoodLabel,
    getMoodColor,
    initialMood: moodHistory.length > 0 ? moodHistory[0].mood : null,
    finalMood: moodHistory.length > 0 ? moodHistory[moodHistory.length - 1].mood : null,
  };
}
