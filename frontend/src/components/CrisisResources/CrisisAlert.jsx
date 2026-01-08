/**
 * CrisisAlert Component
 * Displays crisis resources when crisis keywords are detected
 */

import './CrisisAlert.css';

function CrisisAlert({ crisisInfo }) {
  if (!crisisInfo) return null;

  const { isImmediate, resources, message } = crisisInfo;

  return (
    <div className={`crisis-alert ${isImmediate ? 'crisis-alert-immediate' : 'crisis-alert-concerning'}`}>
      <div className="crisis-alert-content">
        <div className="crisis-alert-header">
          <span className="crisis-alert-icon">⚠️</span>
          <h3 className="crisis-alert-title">
            {isImmediate ? 'Crisis Resources Available 24/7' : 'Support Resources Available'}
          </h3>
        </div>

        {message && (
          <p className="crisis-alert-message">{message}</p>
        )}

        <div className="crisis-resources">
          {resources.map((resource, index) => (
            <div key={index} className="crisis-resource">
              <div className="crisis-resource-name">{resource.name}</div>
              <a
                href={resource.type === 'phone' ? `tel:${resource.contact.replace(/[^0-9]/g, '')}` : '#'}
                className="crisis-resource-contact"
                target={resource.type === 'phone' ? '_self' : '_blank'}
                rel="noopener noreferrer"
              >
                {resource.contact}
              </a>
              <div className="crisis-resource-desc">{resource.description}</div>
            </div>
          ))}
        </div>

        <p className="crisis-alert-footer">
          These resources are free, confidential, and have trained counselors available 24/7.
        </p>
      </div>
    </div>
  );
}

export default CrisisAlert;
