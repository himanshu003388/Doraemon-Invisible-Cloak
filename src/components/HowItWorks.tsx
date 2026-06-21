export default function HowItWorks() {
  return (
    <div>
      <div className="help-step">
        <div className="help-step-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <div className="help-step-content">
          <h3>1. Capture background</h3>
          <p>Frame your scene, step out, then tap Capture. A 3s countdown will start.</p>
        </div>
      </div>

      <div className="help-step">
        <div className="help-step-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3 L19 10 L12 17 L5 10 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="help-step-content">
          <h3>2. Pick cloth color</h3>
          <p>Choose a swatch or sample from your camera with the eyedropper.</p>
        </div>
      </div>

      <div className="help-step">
        <div className="help-step-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 20 C4 12 8 4 12 4 C16 4 20 12 20 20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div className="help-step-content">
          <h3>3. Wear the cloak</h3>
          <p>Step in frame with the colored cloth — it will vanish behind your background.</p>
        </div>
      </div>
    </div>
  );
}
