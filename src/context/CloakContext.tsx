import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { CloakState, CloakAction, TargetColor } from '../types';

const initialState: CloakState = {
  isRunning: false,
  isCameraOn: false,
  backgroundCaptured: false,
  targetColor: [0, 255, 0] as TargetColor,
  tolerance: 100,
  cameraError: null,
  fps: 0,
  activePanel: null,
};

function cloakReducer(state: CloakState, action: CloakAction): CloakState {
  switch (action.type) {
    case 'CAMERA_STARTED':
      return { ...state, isCameraOn: true, cameraError: null };
    case 'CAMERA_STOPPED':
      return { ...state, isCameraOn: false, isRunning: false, backgroundCaptured: false };
    case 'CAMERA_ERROR':
      return { ...state, cameraError: action.error, isCameraOn: false };
    case 'CLEAR_CAMERA_ERROR':
      return { ...state, cameraError: null };
    case 'BACKGROUND_CAPTURED':
      return { ...state, backgroundCaptured: true, isRunning: true };
    case 'BACKGROUND_CLEARED':
      return { ...state, backgroundCaptured: false, isRunning: false };
    case 'SET_COLOR':
      return { ...state, targetColor: action.color };
    case 'SET_TOLERANCE':
      return { ...state, tolerance: action.tolerance };
    case 'SET_FPS':
      return { ...state, fps: action.fps };
    case 'OPEN_PANEL':
      return { ...state, activePanel: state.activePanel === action.panel ? null : action.panel };
    case 'CLOSE_PANEL':
      return { ...state, activePanel: null };
    case 'CLOAK_ACTIVATED':
      return { ...state, isRunning: true };
    case 'CLOAK_DEACTIVATED':
      return { ...state, isRunning: false };
    default:
      return state;
  }
}

interface CloakContextValue {
  state: CloakState;
  dispatch: React.Dispatch<CloakAction>;
}

const CloakContext = createContext<CloakContextValue | null>(null);

export function CloakProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cloakReducer, initialState);
  return (
    <CloakContext.Provider value={{ state, dispatch }}>
      {children}
    </CloakContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCloakState(): CloakContextValue {
  const ctx = useContext(CloakContext);
  if (!ctx) throw new Error('useCloakState must be used within CloakProvider');
  return ctx;
}
