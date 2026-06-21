export type TargetColor = readonly [number, number, number];

export type CameraErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'IN_USE'
  | 'UNKNOWN';

export interface CameraError {
  code: CameraErrorCode;
  message: string;
}

export type PanelId = 'settings' | null;

export interface CloakState {
  isRunning: boolean;
  isCameraOn: boolean;
  backgroundCaptured: boolean;
  targetColor: TargetColor;
  tolerance: number;
  cameraError: CameraError | null;
  fps: number;
  activePanel: PanelId;
}

export type CloakAction =
  | { type: 'CAMERA_STARTED' }
  | { type: 'CAMERA_STOPPED' }
  | { type: 'CAMERA_ERROR'; error: CameraError }
  | { type: 'CLEAR_CAMERA_ERROR' }
  | { type: 'BACKGROUND_CAPTURED' }
  | { type: 'BACKGROUND_CLEARED' }
  | { type: 'SET_COLOR'; color: TargetColor }
  | { type: 'SET_TOLERANCE'; tolerance: number }
  | { type: 'SET_FPS'; fps: number }
  | { type: 'OPEN_PANEL'; panel: Exclude<PanelId, null> }
  | { type: 'CLOSE_PANEL' }
  | { type: 'CLOAK_ACTIVATED' }
  | { type: 'CLOAK_DEACTIVATED' };
