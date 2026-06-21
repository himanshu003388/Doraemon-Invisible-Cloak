// All camera data stays client-side. Permission is requested only on explicit user action (button click).

import { useRef, useCallback, useEffect } from 'react';
import { useCloakState } from '../context/CloakContext';
import type { CameraError, CameraErrorCode } from '../types';

/** Map error codes to user-facing, actionable messages. */
function getCameraErrorMessage(code: CameraErrorCode): string {
  switch (code) {
    case 'NOT_SUPPORTED':
      return 'Your browser does not support camera access. Try Chrome, Firefox, or Edge on desktop or mobile.';
    case 'PERMISSION_DENIED':
      return 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
    case 'NOT_FOUND':
      return 'No camera found. Connect a camera or switch to a device with a built-in camera.';
    case 'IN_USE':
      return 'Camera is already in use by another app. Close any other apps using the camera and try again.';
    case 'UNKNOWN':
      return 'An unexpected error occurred while accessing the camera. Please try again.';
  }
}

/** Classify a getUserMedia error into a structured CameraError with a user-friendly message. */
function classifyCameraError(err: unknown): CameraError {
  if (err instanceof DOMException || (err instanceof Error && 'name' in err)) {
    const name = (err as DOMException).name;
    switch (name) {
      case 'NotAllowedError':
        return { code: 'PERMISSION_DENIED', message: getCameraErrorMessage('PERMISSION_DENIED') };
      case 'NotFoundError':
        return { code: 'NOT_FOUND', message: getCameraErrorMessage('NOT_FOUND') };
      case 'NotReadableError':
        return { code: 'IN_USE', message: getCameraErrorMessage('IN_USE') };
      case 'NotSupportedError':
        return { code: 'NOT_SUPPORTED', message: getCameraErrorMessage('NOT_SUPPORTED') };
    }
  }
  return { code: 'UNKNOWN', message: getCameraErrorMessage('UNKNOWN') };
}

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: { ideal: 'environment' },
  },
};

const FALLBACK_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: { ideal: 'environment' },
  },
};

/**
 * Hook to manage camera lifecycle.
 * Requests camera access at 1280x720 (falls back to 640x480), facing environment.
 * Permission is triggered only when `startCamera` is called (button click required).
 * Exposes detailed error states: NOT_SUPPORTED, PERMISSION_DENIED, NOT_FOUND, IN_USE.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { state, dispatch } = useCloakState();

  // Attach stream to the video element when it becomes available.
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  });

  // Stop camera tracks on unmount to prevent resource/webcam leaks.
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Stop tracks if camera is toggled off.
  useEffect(() => {
    if (!state.isCameraOn && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [state.isCameraOn]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      dispatch({
        type: 'CAMERA_ERROR',
        error: { code: 'NOT_SUPPORTED', message: getCameraErrorMessage('NOT_SUPPORTED') },
      });
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(DEFAULT_CONSTRAINTS);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(FALLBACK_CONSTRAINTS);
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      dispatch({ type: 'CAMERA_STARTED' });
    } catch (err) {
      const cameraErr = classifyCameraError(err);
      dispatch({ type: 'CAMERA_ERROR', error: cameraErr });
    }
  }, [dispatch]);

  return {
    videoRef,
    isCameraOn: state.isCameraOn,
    startCamera,
  };
}
