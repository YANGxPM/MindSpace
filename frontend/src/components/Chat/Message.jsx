/**
 * Message Component
 * Individual message bubble (user or assistant)
 */

import './Message.css';

function Message({ message }) {
  const { role, content, timestamp } = message;
  const isUser = role === 'user';

  const formatTime = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'} ${isUser ? 'slide-in-right' : 'slide-in-left'}`}>
      <div className="message-bubble">
        <p className="message-content">{content}</p>
        {timestamp && (
          <span className="message-timestamp">{formatTime(timestamp)}</span>
        )}
      </div>
    </div>
  );
}

export default Message;
