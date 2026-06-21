import { useCloakState } from '../context/CloakContext';

export default function StatusAnnouncer() {
  const { state } = useCloakState();

  const statusParts: string[] = [];
  if (state.isCameraOn) statusParts.push('Camera is on');
  if (state.backgroundCaptured) statusParts.push('Background captured, cloak effect active');
  if (state.fps > 0) statusParts.push(`${state.fps} frames per second`);

  const announcement = statusParts.length > 0
    ? statusParts.join('. ')
    : 'Application loaded. Start the camera to begin.';

  return (
    <div
      id="aria-live-announcements"
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </div>
  );
}
