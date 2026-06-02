import React from 'react';
import './FeedSkeleton.css';

function SkeletonCard() {
  return (
    <div className="sk-card" aria-hidden="true">
      <div className="sk-head">
        <div className="sk-avatar sk-shimmer" />
        <div className="sk-head-lines">
          <div className="sk-line sk-shimmer" style={{ width: '45%' }} />
          <div className="sk-line sk-shimmer" style={{ width: '30%', height: '10px' }} />
        </div>
      </div>
      <div className="sk-media sk-shimmer" />
      <div className="sk-body">
        <div className="sk-line sk-shimmer" style={{ width: '80%', height: '18px' }} />
        <div className="sk-line sk-shimmer" style={{ width: '60%' }} />
        <div className="sk-line sk-shimmer" style={{ width: '40%' }} />
      </div>
      <div className="sk-actions">
        {[1, 2, 3].map((i) => (
          <div key={i} className="sk-action-btn sk-shimmer" />
        ))}
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="sk-list">
      {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
