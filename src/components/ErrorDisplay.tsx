import { useCloakState } from '../context/CloakContext';

const cameraIllustration = (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <rect x="8" y="16" width="48" height="34" rx="6" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
    <circle cx="32" cy="33" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
    <circle cx="32" cy="33" r="4" fill="currentColor" opacity="0.15" />
    <path d="M44 16 L48 8 L56 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
  </svg>
);

function getErrorContent(): { title: string; message: string } {
  return {
    title: 'Camera pocket is closed',
    message:
      'This gadget needs your camera pocket to work. Please allow camera access in your browser settings, then try again.',
  };
}

function getPermissionContent(): { title: string; message: string } {
  return {
    title: 'Camera permission denied',
    message:
      'The camera pocket is closed. Please open your browser settings and grant camera access for this site.',
  };
}

function getUnsupportedContent(): { title: string; message: string } {
  return {
    title: 'Gadget not compatible',
    message:
      'This 22nd-century gadget requires a modern browser. Try Chrome, Edge, or Firefox on a laptop or phone.',
  };
}

export default function ErrorDisplay() {
  const { state, dispatch } = useCloakState();
  const error = state.cameraError;

  if (!error) return null;

  const content =
    error.code === 'PERMISSION_DENIED'
      ? getPermissionContent()
      : error.code === 'NOT_SUPPORTED'
        ? getUnsupportedContent()
        : getErrorContent();

  return (
    <div className="error-display" role="alert">
      <div className="error-icon">{cameraIllustration}</div>
      <h2 className="error-title">{content.title}</h2>
      <p className="error-message">{content.message}</p>
      <div className="error-retry">
        <button
          type="button"
          className="btn-pill"
          onClick={() => dispatch({ type: 'CLEAR_CAMERA_ERROR' })}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
