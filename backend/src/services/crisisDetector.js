/**
 * Crisis Detection Service
 * Safety-critical component that detects crisis situations and provides resources
 */

const CRISIS_KEYWORDS = {
  immediate: [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
    'hurt myself', 'self harm', 'self-harm', 'better off dead',
    'no reason to live', 'take my life', 'ending it all',
  ],
  concerning: [
    'hopeless', 'no point', "can't go on", 'worthless', 'no way out',
    'give up', 'no hope', 'cant take it anymore', 'too much pain',
    'nobody cares', 'alone forever', 'trapped',
  ],
};

const CRISIS_RESOURCES = [
  {
    name: 'National Suicide Prevention Lifeline',
    contact: '988',
    description: 'Free, confidential support 24/7',
    type: 'phone',
  },
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    description: 'Text-based crisis support',
    type: 'text',
  },
  {
    name: 'SAMHSA National Helpline',
    contact: '1-800-662-4357',
    description: 'Mental health and substance abuse support',
    type: 'phone',
  },
];

/**
 * Detect crisis indicators in user message
 * @param {string} message - User's message
 * @returns {Object} - Detection result with severity and resources
 */
function detectCrisis(message) {
  if (!message || typeof message !== 'string') {
    return {
      detected: false,
      isImmediate: false,
      isConcerning: false,
      resources: [],
    };
  }

  const lowerMessage = message.toLowerCase();

  // Check for immediate crisis keywords
  const hasImmediateKeyword = CRISIS_KEYWORDS.immediate.some(keyword =>
    lowerMessage.includes(keyword)
  );

  // Check for concerning keywords
  const hasConcerningKeyword = CRISIS_KEYWORDS.concerning.some(keyword =>
    lowerMessage.includes(keyword)
  );

  const detected = hasImmediateKeyword || hasConcerningKeyword;

  return {
    detected,
    isImmediate: hasImmediateKeyword,
    isConcerning: hasConcerningKeyword,
    resources: detected ? CRISIS_RESOURCES : [],
    message: detected ? generateCrisisMessage(hasImmediateKeyword) : null,
  };
}

/**
 * Generate appropriate crisis response message
 * @param {boolean} isImmediate - Whether it's an immediate crisis
 * @returns {string} - Crisis response message
 */
function generateCrisisMessage(isImmediate) {
  if (isImmediate) {
    return "I hear that you're going through an incredibly difficult time. I'm a chatbot and not equipped to provide crisis support, but there are people who can help you right now. Please reach out to one of these crisis resources immediately - they're available 24/7 and want to support you.";
  }

  return "I can hear the pain in your words. While I'm here to listen and support you, I want to make sure you have access to professional resources if you need them. Please don't hesitate to reach out to crisis support services - they're trained to help with what you're experiencing.";
}

/**
 * Format crisis resources for display
 * @param {Array} resources - Array of crisis resources
 * @returns {string} - Formatted resource string
 */
function formatResources(resources) {
  return resources
    .map(resource => `${resource.name}: ${resource.contact}\n${resource.description}`)
    .join('\n\n');
}

module.exports = {
  detectCrisis,
  formatResources,
  CRISIS_RESOURCES,
};
