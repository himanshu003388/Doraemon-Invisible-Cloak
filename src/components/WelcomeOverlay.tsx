import { useState } from 'react';
import { PixelBadge } from './PixelBadge';
import { hatFaceMap } from '../data/pixelMaps';

export default function WelcomeOverlay() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="welcome-overlay"
      onAnimationEnd={(e) => {
        if (e.animationName === 'welcome-fade') setDismissed(true);
      }}
    >
      <div className="welcome-content">
        <div className="welcome-brand welcome-animate-logo">
          <PixelBadge pattern={hatFaceMap} pixelSize={8} />
        </div>
        <div className="welcome-text">
          <span className="welcome-line-top welcome-animate-text-top">Welcome to the</span>
          <span className="welcome-line-main welcome-animate-text-main">Doraemon Invisible Cloak</span>
        </div>
      </div>
    </div>
  );
}
