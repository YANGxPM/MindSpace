/**
 * MessageInput Component
 * Text input for sending messages
 */

import { useState, useRef } from 'react';
import './MessageInput.css';

function MessageInput({ onSend, disabled = false, placeholder = "Type your message..." }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;

    // Limit to 2000 characters
    if (value.length <= 2000) {
      setMessage(value);

      // Auto-resize textarea
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
      }
    }
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <div className="message-input-container">
        <textarea
          ref={textareaRef}
          className="message-input"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />

        <button
          type="submit"
          className="send-button"
          disabled={!message.trim() || disabled}
          aria-label="Send message"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      {message.length > 1800 && (
        <div className="character-count">
          {message.length}/2000
        </div>
      )}
    </form>
  );
}

export default MessageInput;
