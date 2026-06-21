// Background frame is stored in memory only. It is never uploaded or persisted to disk.

import { useRef, useCallback } from 'react';
import { useCloakState } from '../context/CloakContext';

export function useBackground() {
  const backgroundRef = useRef<ImageData | null>(null);
  const { dispatch } = useCloakState();

  const captureBackground = useCallback((video: HTMLVideoElement, width: number, height: number) => {
    const ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(width, height).getContext('2d')
      : (() => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          return canvas.getContext('2d');
        })();
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    backgroundRef.current = ctx.getImageData(0, 0, width, height);

    dispatch({ type: 'BACKGROUND_CAPTURED' });
  }, [dispatch]);

  const clearBackground = useCallback(() => {
    backgroundRef.current = null;
    dispatch({ type: 'BACKGROUND_CLEARED' });
  }, [dispatch]);

  return { backgroundRef, captureBackground, clearBackground };
}
