import { useState, useCallback, useRef } from 'react';
import { useCloakState } from '../context/CloakContext';
import { rgbToHex } from '../engine/cloakEngine';
import type { TargetColor } from '../types';

const SWATCHES: { label: string; color: TargetColor; hex: string }[] = [
  { label: 'Green', color: [0, 255, 0] as TargetColor, hex: '#00ff00' },
  { label: 'Blue', color: [0, 0, 255] as TargetColor, hex: '#0000ff' },
  { label: 'Red', color: [255, 0, 0] as TargetColor, hex: '#ff0000' },
  { label: 'Yellow', color: [255, 255, 0] as TargetColor, hex: '#ffff00' },
];

const HEX_RE = /^#?[0-9a-f]{6}$/i;

function hexToTarget(hex: string): TargetColor {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] as TargetColor;
}

export default function SettingsPanel() {
  const { state, dispatch } = useCloakState();
  const handleOk = useCallback(() => dispatch({ type: 'CLOSE_PANEL' }), [dispatch]);
  const [customHex, setCustomHex] = useState(() => rgbToHex(...state.targetColor));
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleSwatch = useCallback(
    (color: TargetColor, hex: string) => {
      dispatch({ type: 'SET_COLOR', color });
      setCustomHex(hex);
      dispatch({ type: 'CLOSE_PANEL' });
    },
    [dispatch],
  );

  const handleCustomHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCustomHex(val);
      if (HEX_RE.test(val)) {
        const color = hexToTarget(val);
        dispatch({ type: 'SET_COLOR', color });
      }
    },
    [dispatch],
  );

  const handleEyedropper = useCallback(async () => {
    if (!('EyeDropper' in window)) return;
    dispatch({ type: 'CLOSE_PANEL' });
    try {
      const ed = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
      const result = await ed.open();
      const hex = result.sRGBHex;
      if (HEX_RE.test(hex)) {
        setCustomHex(hex);
        dispatch({ type: 'SET_COLOR', color: hexToTarget(hex) });
      }
    } catch {
      /* user cancelled */
    }
  }, [dispatch]);

  const handleToleranceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'SET_TOLERANCE', tolerance: Number(e.target.value) });
    },
    [dispatch],
  );

  return (
    <div>
      <div className="settings-section">
        <div className="settings-label">Cloth Color</div>

        <div className="swatch-honeycomb">
          {SWATCHES.map((s) => (
            <button
              key={s.label}
              type="button"
              className={`honeycomb-btn${state.targetColor.join(',') === s.color.join(',') ? ' selected' : ''}`}
              style={{ '--swatch-color': s.hex } as React.CSSProperties}
              onClick={() => handleSwatch(s.color, s.hex)}
              aria-label={`Select ${s.label}`}
              aria-pressed={state.targetColor.join(',') === s.color.join(',')}
            >
              <span className="honeycomb-inner">
                <span className="honeycomb-color-dot" style={{ backgroundColor: s.hex }} />
                <span className="honeycomb-label">{s.label}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="custom-row" style={{ marginTop: 'var(--space-3)', position: 'relative' }}>
          <input
            ref={colorInputRef}
            type="color"
            value={customHex}
            onChange={handleCustomHexChange}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            aria-label="Custom color picker"
          />
          <button
            type="button"
            className="pick-color-btn"
            style={{ '--swatch-color': customHex } as React.CSSProperties}
            onClick={() => colorInputRef.current?.click()}
            aria-label="Open color picker dialog"
          >
            <span
              className="color-preview-circle"
              style={{ backgroundColor: customHex }}
            />
            Pick Color
          </button>
          <button
            type="button"
            className="eyedropper-btn"
            onClick={handleEyedropper}
            disabled={typeof window === 'undefined' || !('EyeDropper' in window)}
            title={typeof window !== 'undefined' && 'EyeDropper' in window ? 'Pick color from screen' : 'Eyedropper is not supported in your browser (Chrome/Edge/Opera only)'}
            aria-label="Pick color from camera feed"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="8" cy="8" r="2" fill="currentColor" />
            </svg>
            Eyedropper
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Tolerance</div>

        <div className="tolerance-row">
          <div className="tolerance-track">
            <div
              className="tolerance-fill"
              style={{ width: `${(state.tolerance / 200) * 100}%` }}
            />
            <input
              type="range"
              className="tolerance-range"
              min={0}
              max={200}
              value={state.tolerance}
              onChange={handleToleranceChange}
              aria-label="Tolerance level"
              aria-valuemin={0}
              aria-valuemax={200}
              aria-valuenow={state.tolerance}
            />
          </div>
          <span className="tolerance-value">{state.tolerance}</span>
        </div>
      </div>

      <div className="settings-ok-wrap">
        <button type="button" className="btn-settings-ok" onClick={handleOk}>OK</button>
      </div>
    </div>
  );
}
