/**
 * MessageList Component
 * Displays list of messages with auto-scroll
 */

import { useEffect, useRef } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import './MessageList.css';

function MessageList({ messages, isTyping }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="message-list" ref={containerRef}>
      <div className="message-list-content">
        {messages.length === 0 && !isTyping && (
          <div className="empty-state">
            <p className="empty-state-text">
              Hi, I'm MindSpace. I'm here to listen and support you through what you're experiencing.
            </p>
            <p className="empty-state-subtext">
              What's been weighing on you?
            </p>
          </div>
        )}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {isTyping && (
          <div className="message message-assistant slide-in-left">
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default MessageList;
