import { useCloakState } from '../context/CloakContext';
import { PixelBadge } from './PixelBadge';
import { hatFaceMap } from '../data/pixelMaps';

export default function TrackerNav() {
  const { state } = useCloakState();

  return (
    <>
      <nav className="nav-bar" role="navigation" aria-label="Main navigation">
        <div className="nav-left">
          <button
            type="button"
            className="nav-logo"
            onClick={() => window.location.reload()}
            aria-label="Reload page"
          >
            <PixelBadge pattern={hatFaceMap} pixelSize={2} />
          </button>
          <span className="nav-tagline">Doraemon's Invisible Cloak</span>
        </div>
      <div className="nav-right">
        {state.isCameraOn && (
          <div className="nav-rec-badge" aria-label="Recording active">
            <span className="nav-rec-dot" aria-hidden="true" />
            <span>REC</span>
          </div>
        )}
        <div className="nav-status">
          <span className={`nav-dot${state.isRunning ? ' live' : ''}`} />
          {state.isRunning ? 'Cloak Active' : 'Standby'}
        </div>
      </div>
    </nav>
    </>
  );
}
