import { useRef, useCallback, useState } from 'react';
import { CloakProvider, useCloakState } from './context/CloakContext';
import { useCamera } from './hooks/useCamera';
import { useBackground } from './hooks/useBackground';
import TrackerNav from './components/TrackerNav';
import TrackerFooter from './components/TrackerFooter';
import VideoCanvas from './components/VideoCanvas';
import CountdownOverlay from './components/CountdownOverlay';
import ShimmerOverlay from './components/ShimmerOverlay';
import ErrorDisplay from './components/ErrorDisplay';
import SlidePanel from './components/SlidePanel';
import StatusAnnouncer from './components/StatusAnnouncer';
import HowItWorks from './components/HowItWorks';
import WelcomeOverlay from './components/WelcomeOverlay';

function AppInner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { videoRef, startCamera, isCameraOn } = useCamera();
  const { backgroundRef, captureBackground, clearBackground } = useBackground();
  const { state, dispatch } = useCloakState();

  const [isCapturing, setIsCapturing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bootScanKey, setBootScanKey] = useState(0);

  const handleStartCamera = useCallback(() => {
    startCamera();
  }, [startCamera]);

  const handleCaptureBg = useCallback(() => {
    if (isCapturing) return;
    setIsCapturing(true);
  }, [isCapturing]);

  const handleCountdownComplete = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    captureBackground(video, w, h);
    setIsCapturing(false);
    setShowConfirm(true);
    setBootScanKey(k => k + 1);
    dispatch({ type: 'CLOAK_ACTIVATED' });
  }, [videoRef, canvasRef, captureBackground, dispatch]);

  const handleRetake = useCallback(() => {
    clearBackground();
    setShowConfirm(false);
    dispatch({ type: 'CLOAK_DEACTIVATED' });
  }, [clearBackground, dispatch]);

  const handleColorPicker = useCallback(() => {
    dispatch({ type: 'OPEN_PANEL', panel: 'settings' });
  }, [dispatch]);

  const stageContent = () => {
    if (state.cameraError) return <ErrorDisplay />;

    return (
      <div className="hero-viewport">
        {!isCameraOn ? (
          <div className="hero-empty">
            <svg className="hero-empty-svg-deco" width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* Randomly placed abstract diagonal tick lines */}
              <line x1="120" y1="310" x2="160" y2="270" stroke="rgba(0, 212, 255, 0.15)" strokeWidth="1" />
              <line x1="460" y1="70" x2="500" y2="110" stroke="rgba(0, 212, 255, 0.15)" strokeWidth="1" />
              <line x1="280" y1="320" x2="340" y2="320" stroke="rgba(0, 212, 255, 0.12)" strokeWidth="1" />

              {/* Scattered random blue dots */}
              <circle cx="140" cy="80" r="2.5" fill="#00d4ff" opacity="0.6" />
              <circle cx="230" cy="170" r="1.5" fill="#00d4ff" opacity="0.4" />
              <circle cx="90" cy="230" r="2" fill="#00d4ff" opacity="0.5" />
              <circle cx="390" cy="60" r="3" fill="#00d4ff" opacity="0.7" />
              <circle cx="510" cy="150" r="2" fill="#00d4ff" opacity="0.5" />
              <circle cx="480" cy="220" r="1.5" fill="#00d4ff" opacity="0.4" />
              <circle cx="170" cy="290" r="2.5" fill="#00d4ff" opacity="0.6" />

              {/* Coordinate tick markers (+ shapes) */}
              <path d="M 330,90 H 336 M 333,87 V 93" stroke="rgba(0, 212, 255, 0.35)" strokeWidth="1" />
              <path d="M 190,210 H 196 M 193,207 V 213" stroke="rgba(0, 212, 255, 0.35)" strokeWidth="1" />
              <path d="M 430,190 H 436 M 433,187 V 193" stroke="rgba(0, 212, 255, 0.35)" strokeWidth="1" />
            </svg>
            <p className="hero-empty-title">
              <span className="title-line">Start your</span>
              <span className="title-word-invisible">INVISIBLE</span>
              <span className="title-line">Magic Cloth</span>
            </p>
            <p className="hero-empty-sub">
              Point your camera at a cloth backdrop to turn invisible
            </p>
            <button type="button" className="btn-pill" onClick={handleStartCamera}>
              Activate Camera
            </button>
          </div>
        ) : (
          <>
            <VideoCanvas
              videoRef={videoRef}
              canvasRef={canvasRef}
              backgroundRef={backgroundRef}
            />
            {!isCapturing && (
              <div className="viewport-actions" role="toolbar" aria-label="Camera controls">
                <button
                  type="button"
                  className="btn-action btn-action-primary"
                  onClick={showConfirm ? handleRetake : handleCaptureBg}
                >
                  {showConfirm ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M1 4v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="15" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  )}
                  {showConfirm ? 'Retake Background' : 'Capture Background'}
                </button>
                <button
                  type="button"
                  className="btn-action btn-action-secondary"
                  onClick={handleColorPicker}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                  </svg>
                  Cloth Color
                </button>
              </div>
            )}
            {isCapturing && <CountdownOverlay onComplete={handleCountdownComplete} />}

            {state.isRunning && !isCapturing && (
              <>
                <div className="scan-effect" key={bootScanKey} aria-hidden="true" />
                <ShimmerOverlay />
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <WelcomeOverlay />

      <a href="#stage" className="skip-link">Skip to main content</a>

      <TrackerNav />

      <section className={`hero-section ${isCameraOn || state.cameraError ? 'dark' : ''}`} id="stage" role="main">
        <div className="hero-layout">
          <aside className="hero-instructions" aria-label="Instructions">
            <h2 className="info-heading">Information</h2>
            <HowItWorks />
          </aside>
          <div className="hero-frame hero-brackets">
            <div className="scanline" aria-hidden="true" />
            {stageContent()}
            <div className="hero-bracket-bl" aria-hidden="true" />
            <div className="hero-bracket-br" aria-hidden="true" />
          </div>
        </div>
      </section>

      <SlidePanel />
      <TrackerFooter />
      <StatusAnnouncer />
    </>
  );
}

export default function App() {
  return (
    <CloakProvider>
      <AppInner />
    </CloakProvider>
  );
}
