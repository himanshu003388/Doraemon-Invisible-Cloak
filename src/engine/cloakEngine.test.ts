import { describe, it, expect } from 'vitest';
import {
  rgbToHsv,
  hsvDistance,
  MAX_DISTANCE,
  processFrame,
  applyCloakEffect,
} from './cloakEngine';

function makeImageData(pixels: number[] | Uint8ClampedArray, width: number, height: number): ImageData {
  return new ImageData(new Uint8ClampedArray(pixels), width, height);
}

describe('rgbToHsv', () => {
  it('converts red correctly', () => {
    const [h, s, v] = rgbToHsv(255, 0, 0);
    expect(h).toBeCloseTo(0, 1);
    expect(s).toBeCloseTo(1, 2);
    expect(v).toBeCloseTo(1, 2);
  });

  it('converts green correctly', () => {
    const [h, s, v] = rgbToHsv(0, 255, 0);
    expect(h).toBeCloseTo(120, 1);
    expect(s).toBeCloseTo(1, 2);
    expect(v).toBeCloseTo(1, 2);
  });

  it('converts blue correctly', () => {
    const [h, s, v] = rgbToHsv(0, 0, 255);
    expect(h).toBeCloseTo(240, 1);
    expect(s).toBeCloseTo(1, 2);
    expect(v).toBeCloseTo(1, 2);
  });

  it('converts black correctly', () => {
    const [h, s, v] = rgbToHsv(0, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(v).toBe(0);
  });

  it('converts white correctly', () => {
    const s = rgbToHsv(255, 255, 255)[1];
    const v = rgbToHsv(255, 255, 255)[2];
    expect(s).toBe(0);
    expect(v).toBe(1);
  });

  it('converts gray correctly', () => {
    const s = rgbToHsv(128, 128, 128)[1];
    const v = rgbToHsv(128, 128, 128)[2];
    expect(s).toBe(0);
    expect(v).toBeCloseTo(0.502, 2);
  });
});

describe('hsvDistance', () => {
  it('returns 0 for identical colors', () => {
    expect(hsvDistance(120, 0.5, 0.5, 120, 0.5, 0.5)).toBe(0);
  });

  it('treats circular hue correctly (0 and 360 are same)', () => {
    const d = hsvDistance(0, 0.5, 0.5, 360, 0.5, 0.5);
    expect(d).toBeCloseTo(0, 2);
  });

  it('treats circular hue correctly (near wrap)', () => {
    const d = hsvDistance(355, 0.5, 0.5, 5, 0.5, 0.5);
    expect(d).toBeLessThan(hsvDistance(10, 0.5, 0.5, 355, 1, 1));
  });

  it('is symmetric', () => {
    const d1 = hsvDistance(100, 0.3, 0.2, 200, 0.8, 0.9);
    const d2 = hsvDistance(200, 0.8, 0.9, 100, 0.3, 0.2);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('values same hue with different brightness (lighting change) is smaller than different hue', () => {
    const sameHue = hsvDistance(120, 1, 1, 120, 0.8, 0.3);
    const diffHue = hsvDistance(120, 1, 1, 200, 1, 1);
    expect(sameHue).toBeLessThan(diffHue);
  });
});

describe('processFrame', () => {
  it('replaces matching pixels with background', () => {
    const frame = makeImageData([
      255, 0, 0, 255, 255, 0, 0, 255,
      255, 0, 0, 255, 255, 0, 0, 255,
    ], 2, 2);

    const bg = makeImageData([
      0, 0, 255, 255, 0, 0, 255, 255,
      0, 0, 255, 255, 0, 0, 255, 255,
    ], 2, 2);

    const result = processFrame(frame, bg, [255, 0, 0], 100);

    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(0);
      expect(result.data[i + 1]).toBe(0);
      expect(result.data[i + 2]).toBe(255);
      expect(result.data[i + 3]).toBe(255);
    }
  });

  it('keeps non-matching pixels unchanged', () => {
    const frame = makeImageData([
      255, 0, 0, 255, 0, 255, 0, 255,
      0, 0, 255, 255, 255, 255, 0, 255,
    ], 2, 2);

    const bg = makeImageData([
      128, 128, 128, 255, 128, 128, 128, 255,
      128, 128, 128, 255, 128, 128, 128, 255,
    ], 2, 2);

    const result = processFrame(frame, bg, [255, 0, 0], 50);

    expect(result.data[0]).toBe(128);
    expect(result.data[1]).toBe(128);
    expect(result.data[2]).toBe(128);

    expect(result.data[4]).toBe(0);
    expect(result.data[5]).toBe(255);
    expect(result.data[6]).toBe(0);
  });

  it('replaces pixels within tolerance', () => {
    const frame = makeImageData([250, 5, 5, 255], 1, 1);
    const bg = makeImageData([0, 0, 0, 255], 1, 1);

    const tight = processFrame(frame, bg, [255, 0, 0], 3);
    expect(tight.data[0]).toBe(250);

    const wide = processFrame(frame, bg, [255, 0, 0], 10);
    expect(wide.data[0]).toBe(0);
  });

  it('preserves alpha channel from background for matched pixels', () => {
    const frame = makeImageData([255, 0, 0, 200], 1, 1);
    const bg = makeImageData([10, 20, 30, 180], 1, 1);

    const result = processFrame(frame, bg, [255, 0, 0], 50);
    expect(result.data[3]).toBe(180);
  });

  it('handles tolerance of 0 (exact match only)', () => {
    const frame = makeImageData([
      255, 0, 0, 255, 254, 0, 0, 255,
    ], 2, 1);

    const bg = makeImageData([
      0, 0, 0, 255, 0, 0, 0, 255,
    ], 2, 1);

    const result = processFrame(frame, bg, [255, 0, 0], 0);

    expect(result.data[0]).toBe(0);
    expect(result.data[4]).toBe(254);
  });

  it('handles maximum tolerance (replaces all pixels)', () => {
    const frame = makeImageData([100, 150, 200, 255], 1, 1);
    const bg = makeImageData([255, 255, 255, 255], 1, 1);

    const result = processFrame(frame, bg, [0, 0, 0], 400);
    expect(result.data[0]).toBe(255);
    expect(result.data[1]).toBe(255);
    expect(result.data[2]).toBe(255);
  });

  it('throws error when dimensions mismatch', () => {
    const frame = makeImageData([255, 0, 0, 255], 1, 1);
    const bg = makeImageData([0, 0, 255, 255, 0, 0, 255, 255], 2, 1);
    const bg2 = makeImageData([0, 0, 255, 255, 0, 0, 255, 255], 1, 2);

    expect(() => processFrame(frame, bg, [255, 0, 0], 100)).toThrow('Frame dimensions');
    expect(() => processFrame(frame, bg2, [255, 0, 0], 100)).toThrow('Frame dimensions');
  });

  it('matches no pixels when color is completely different', () => {
    const frame = makeImageData([10, 20, 30, 255], 1, 1);
    const bg = makeImageData([255, 255, 255, 255], 1, 1);

    const result = processFrame(frame, bg, [255, 0, 0], 50);
    expect(result.data[0]).toBe(10);
    expect(result.data[1]).toBe(20);
    expect(result.data[2]).toBe(30);
  });

  it('processes a larger frame correctly', () => {
    const size = 50;
    const frameData = new Uint8ClampedArray(size * size * 4);
    const bgData = new Uint8ClampedArray(size * size * 4);

    for (let i = 0; i < size * size * 4; i += 4) {
      frameData[i] = 0;
      frameData[i + 1] = 255;
      frameData[i + 2] = 0;
      frameData[i + 3] = 255;

      bgData[i] = 128;
      bgData[i + 1] = 128;
      bgData[i + 2] = 128;
      bgData[i + 3] = 255;
    }

    const frame = makeImageData(frameData, size, size);
    const bg = makeImageData(bgData, size, size);

    const result = processFrame(frame, bg, [0, 255, 0], 50);

    let replacedCount = 0;
    for (let i = 0; i < result.data.length; i += 4) {
      if (result.data[i] === 128) replacedCount++;
    }
    expect(replacedCount).toBe(size * size);
  });

  it('does not mutate the input frame data', () => {
    const original = [255, 0, 0, 255];
    const frame = makeImageData(Array.from(original), 1, 1);
    const bg = makeImageData([0, 0, 0, 255], 1, 1);

    processFrame(frame, bg, [255, 0, 0], 50);

    expect(frame.data[0]).toBe(255);
    expect(frame.data[1]).toBe(0);
    expect(frame.data[2]).toBe(0);
  });

  it('does not mutate the input background data', () => {
    const original = [0, 0, 0, 255];
    const frame = makeImageData([255, 0, 0, 255], 1, 1);
    const bg = makeImageData(Array.from(original), 1, 1);

    processFrame(frame, bg, [255, 0, 0], 50);

    expect(bg.data[0]).toBe(0);
    expect(bg.data[1]).toBe(0);
    expect(bg.data[2]).toBe(0);
  });

  it('matches same hue under different brightness (lighting invariance)', () => {
    const frame = makeImageData([0, 128, 0, 255], 1, 1);
    const bg = makeImageData([200, 100, 100, 255], 1, 1);

    const result = processFrame(frame, bg, [0, 255, 0], 100);
    expect(result.data[0]).toBe(200);
  });
});

describe('applyCloakEffect', () => {
  it('replaces matching pixels with background (large uniform block)', () => {
    const size = 4;
    const frameData = new Uint8ClampedArray(size * size * 4);
    const bgData = new Uint8ClampedArray(size * size * 4);

    for (let i = 0; i < size * size * 4; i += 4) {
      frameData[i] = 255;
      frameData[i + 1] = 0;
      frameData[i + 2] = 0;
      frameData[i + 3] = 255;
      bgData[i] = 0;
      bgData[i + 1] = 0;
      bgData[i + 2] = 255;
      bgData[i + 3] = 255;
    }

    const frame = makeImageData(frameData, size, size);
    const bg = makeImageData(bgData, size, size);

    const result = applyCloakEffect(frame, bg, [255, 0, 0], 100);

    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(0);
      expect(result.data[i + 1]).toBe(0);
      expect(result.data[i + 2]).toBe(255);
    }
  });

  it('preserves non-matching pixels', () => {
    const frame = makeImageData([10, 20, 30, 255], 1, 1);
    const bg = makeImageData([200, 100, 100, 255], 1, 1);

    const result = applyCloakEffect(frame, bg, [255, 0, 0], 50);
    expect(result.data[0]).toBe(10);
  });

  it('throws on dimension mismatch', () => {
    const frame = makeImageData([255, 0, 0, 255], 1, 1);
    const bg = makeImageData([0, 0, 255, 255, 0, 0, 255, 255], 2, 1);

    expect(() => applyCloakEffect(frame, bg, [255, 0, 0], 100)).toThrow('Frame dimensions');
  });

  it('erodes isolated matching pixels (speckle noise removal)', () => {
    const size = 3;
    const frameData = new Uint8ClampedArray(size * size * 4);
    const bgData = new Uint8ClampedArray(size * size * 4);

    for (let i = 0; i < size * size * 4; i++) {
      frameData[i] = 0;
      bgData[i] = 100;
    }
    frameData[3] = 255;
    bgData[3] = 255;

    const center = 4;
    frameData[center * 4] = 255;
    frameData[center * 4 + 1] = 0;
    frameData[center * 4 + 2] = 0;
    frameData[center * 4 + 3] = 255;

    const frame = makeImageData(frameData, size, size);
    const bg = makeImageData(bgData, size, size);

    const result = applyCloakEffect(frame, bg, [255, 0, 0], 50);

    expect(result.data[center * 4]).toBe(255);
  });

  it('fills small holes (dilation closes gaps in large matching region)', () => {
    const size = 4;
    const frameData = new Uint8ClampedArray(size * size * 4);
    const bgData = new Uint8ClampedArray(size * size * 4);

    for (let i = 0; i < size * size * 4; i += 4) {
      frameData[i] = 255;
      frameData[i + 1] = 0;
      frameData[i + 2] = 0;
      frameData[i + 3] = 255;
      bgData[i] = 100;
      bgData[i + 1] = 100;
      bgData[i + 2] = 100;
      bgData[i + 3] = 255;
    }

    const center = (1 * size + 1) * 4;
    frameData[center] = 0;
    frameData[center + 1] = 255;
    frameData[center + 2] = 0;

    const frame = makeImageData(frameData, size, size);
    const bg = makeImageData(bgData, size, size);

    const result = applyCloakEffect(frame, bg, [255, 0, 0], 50);

    expect(result.data[center]).toBe(100);
  });
});

describe('MAX_DISTANCE', () => {
  it('equals sqrt(255^2 * 3)', () => {
    expect(MAX_DISTANCE).toBe(Math.sqrt(255 * 255 * 3));
  });
});
