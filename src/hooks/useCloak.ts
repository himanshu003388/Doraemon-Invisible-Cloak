import { useEffect, useRef, useCallback } from 'react';
import { applyCloakEffect } from '../engine/cloakEngine';
import { useCloakState } from '../context/CloakContext';

export function useCloak(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  backgroundRef: React.MutableRefObject<ImageData | null>,
) {
  const { state, dispatch } = useCloakState();
  const rafRef = useRef<number>(0);
  const fpsFrames = useRef<number[]>([]);
  const fpsInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Maintain a mutable reference to the latest state values to avoid stale closures
  // and prevent tearing down/re-running the effect on every slider or color change.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateFps = useCallback((timestamp: number) => {
    fpsFrames.current.push(timestamp);
    const cutoff = timestamp - 1000;
    fpsFrames.current = fpsFrames.current.filter(t => t > cutoff);
  }, []);

  useEffect(() => {
    fpsInterval.current = setInterval(() => {
      const current = fpsFrames.current.length;
      dispatch({ type: 'SET_FPS', fps: current });
    }, 500);

    return () => {
      if (fpsInterval.current) clearInterval(fpsInterval.current);
    };
  }, [dispatch]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!state.isCameraOn) return;

    // Sync canvas resolution to video dimensions once metadata is available.
    const syncSize = () => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c) return;
      if (v.videoWidth > 0 && v.videoHeight > 0) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
      }
    };
    video.addEventListener('loadedmetadata', syncSize);
    syncSize();

    let active = true;

    function tick(now: number) {
      if (!active) return;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (v.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Sync size once video dimensions are known
      if (c.width === 0 && v.videoWidth > 0) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        syncSize();
      }

      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const w = c.width;
      const h = c.height;

      ctx.drawImage(v, 0, 0, w, h);

      const bg = backgroundRef.current;
      if (bg) {
        const frame = ctx.getImageData(0, 0, w, h);
        const tolerance = stateRef.current.tolerance;
        const targetColor: [number, number, number] = [...stateRef.current.targetColor];
        const output = applyCloakEffect(frame, bg, targetColor, tolerance);
        ctx.putImageData(output, 0, 0);
      }

      updateFps(now);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    const handleVisibility = () => {
      cancelAnimationFrame(rafRef.current);
      if (!document.hidden) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('loadedmetadata', syncSize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [state.isCameraOn, backgroundRef, videoRef, canvasRef, updateFps]);
}
