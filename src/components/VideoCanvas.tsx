import { useCloak } from '../hooks/useCloak';
import type { MutableRefObject, RefObject } from 'react';

interface VideoCanvasProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  backgroundRef: MutableRefObject<ImageData | null>;
}

export default function VideoCanvas({ videoRef, canvasRef, backgroundRef }: VideoCanvasProps) {
  useCloak(videoRef, canvasRef, backgroundRef);

  return (
    <>
      <video ref={videoRef as React.RefObject<HTMLVideoElement>} className="hero-video" autoPlay muted playsInline />
      <canvas ref={canvasRef as React.RefObject<HTMLCanvasElement>} className="hero-stage" />
    </>
  );
}
