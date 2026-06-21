import { useEffect, useState, useRef } from 'react';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export default function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);
  const [visible, setVisible] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(showTimer);
  }, []);

  useEffect(() => {
    if (count <= 0) {
      onCompleteRef.current();
      return;
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  if (count <= 0) return null;

  return (
    <div className={`countdown-overlay${visible ? ' visible' : ''}`} role="alert" aria-live="assertive">
      <span className={`countdown-digit${visible ? ' active' : ''}`} key={count}>
        {count}
      </span>
      <span className="countdown-label">Please move out of the frame to capture the background</span>
      <span className="sr-only">Capturing background in {count}…</span>
    </div>
  );
}
