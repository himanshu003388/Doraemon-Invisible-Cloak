// All processing is client-side. No video frames or image data ever leave this device.

/** Convert an RGB pixel (0–255 each) to HSV. Returns [hue (0–360), saturation (0–1), value (0–1)]. */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;

  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rf) {
      h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6;
    } else if (max === gf) {
      h = ((bf - rf) / d + 2) / 6;
    } else {
      h = ((rf - gf) / d + 4) / 6;
    }
  }

  const s = max === 0 ? 0 : d / max;
  return [h * 360, s, max];
}

/**
 * Weighted Euclidean distance in HSV space.
 * Hue and saturation dominate; value (brightness) has minimal weight,
 * making matches robust against lighting changes.
 * Hue difference is circular (0° and 360° are identical).
 */
export function hsvDistance(
  h1: number, s1: number, v1: number,
  h2: number, s2: number, v2: number,
): number {
  const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
  const dh = (hueDiff / 360) * 255;
  const ds = Math.abs(s1 - s2) * 255;
  const dv = Math.abs(v1 - v2) * 255;

  return Math.sqrt(dh * dh * 2.1 + ds * ds * 0.85 + dv * dv * 0.05);
}

/** Convert RGB (0–255) to a hex colour string like "#ff00ff". */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

export const MAX_DISTANCE = Math.sqrt(255 * 255 * 3);

// Pre-allocated static buffers to avoid GC pressure (allocation thrashing)
let cachedMask: Uint8Array | null = null;
let cachedEroded: Uint8Array | null = null;
let cachedCleaned: Uint8Array | null = null;
let cachedOutput: Uint8ClampedArray | null = null;
let cachedImageData: ImageData | null = null;

function ensureBuffers(width: number, height: number) {
  const pixelCount = width * height;
  const dataLength = pixelCount * 4;

  if (!cachedMask || cachedMask.length !== pixelCount) {
    cachedMask = new Uint8Array(pixelCount);
    cachedEroded = new Uint8Array(pixelCount);
    cachedCleaned = new Uint8Array(pixelCount);
    cachedOutput = new Uint8ClampedArray(dataLength);
    cachedImageData = new ImageData(cachedOutput as unknown as ImageData['data'], width, height);
  }
}

/** Build a binary mask where 1 = pixel matches target colour within tolerance, 0 = no match. */
function buildMask(
  frame: ImageData,
  targetColor: [number, number, number],
  tolerance: number,
  outMask: Uint8Array,
): void {
  const { data, width, height } = frame;
  const pixelCount = width * height;

  const tr = targetColor[0] / 255;
  const tg = targetColor[1] / 255;
  const tb = targetColor[2] / 255;

  const tMax = Math.max(tr, tg, tb);
  const tMin = Math.min(tr, tg, tb);
  const td = tMax - tMin;

  let th = 0;
  if (td !== 0) {
    if (tMax === tr) {
      th = ((tg - tb) / td + (tg < tb ? 6 : 0)) / 6;
    } else if (tMax === tg) {
      th = ((tb - tr) / td + 2) / 6;
    } else {
      th = ((tr - tg) / td + 4) / 6;
    }
  }
  const ts = tMax === 0 ? 0 : td / tMax;
  const tv = tMax;

  const thDeg = th * 360;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;

    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
      if (max === rf) {
        h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6;
      } else if (max === gf) {
        h = ((bf - rf) / d + 2) / 6;
      } else {
        h = ((rf - gf) / d + 4) / 6;
      }
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;

    const hDeg = h * 360;
    const hueDiff = Math.min(Math.abs(hDeg - thDeg), 360 - Math.abs(hDeg - thDeg));
    const dh = (hueDiff / 360) * 255;
    const ds = Math.abs(s - ts) * 255;
    const dv = Math.abs(v - tv) * 255;

    const dist = Math.sqrt(dh * dh * 2.1 + ds * ds * 0.85 + dv * dv * 0.05);

    outMask[i] = dist <= tolerance ? 1 : 0;
  }
}

/** Single-pass erosion: a pixel survives (stays 1) only if ≥5 of its 3×3 neighbourhood are also 1. */
function erodeMask(mask: Uint8Array, width: number, height: number, outEroded: Uint8Array): void {
  for (let y = 0; y < height; y++) {
    const yWidth = y * width;
    const yMin = Math.max(0, y - 1);
    const yMax = Math.min(height - 1, y + 1);

    for (let x = 0; x < width; x++) {
      const idx = yWidth + x;

      if (mask[idx] === 0) {
        outEroded[idx] = 0;
        continue;
      }

      let count = 0;
      const xMin = Math.max(0, x - 1);
      const xMax = Math.min(width - 1, x + 1);

      for (let ny = yMin; ny <= yMax; ny++) {
        const nyWidth = ny * width;
        for (let nx = xMin; nx <= xMax; nx++) {
          if (mask[nyWidth + nx] === 1) count++;
        }
      }

      outEroded[idx] = count >= 5 ? 1 : 0;
    }
  }
}

/** Single-pass dilation: a pixel becomes 1 if any of its 3×3 neighbours is 1. */
function dilateMask(mask: Uint8Array, width: number, height: number, outDilated: Uint8Array): void {
  for (let y = 0; y < height; y++) {
    const yWidth = y * width;
    const yMin = Math.max(0, y - 1);
    const yMax = Math.min(height - 1, y + 1);

    for (let x = 0; x < width; x++) {
      const idx = yWidth + x;

      if (mask[idx] === 1) {
        outDilated[idx] = 1;
        continue;
      }

      const xMin = Math.max(0, x - 1);
      const xMax = Math.min(width - 1, x + 1);
      let any = false;

      for (let ny = yMin; ny <= yMax && !any; ny++) {
        const nyWidth = ny * width;
        for (let nx = xMin; nx <= xMax; nx++) {
          if (mask[nyWidth + nx] === 1) {
            any = true;
            break;
          }
        }
      }

      outDilated[idx] = any ? 1 : 0;
    }
  }
}

/** Replace pixels in `output` with background pixels where the binary mask is 1. */
function applyMask(
  frameData: Uint8ClampedArray,
  bgData: Uint8ClampedArray,
  mask: Uint8Array,
  outOutput: Uint8ClampedArray,
): void {
  outOutput.set(frameData);
  const len = frameData.length / 4;
  for (let i = 0; i < len; i++) {
    if (mask[i] === 1) {
      const offset = i * 4;
      outOutput[offset] = bgData[offset];
      outOutput[offset + 1] = bgData[offset + 1];
      outOutput[offset + 2] = bgData[offset + 2];
      outOutput[offset + 3] = bgData[offset + 3];
    }
  }
}

/**
 * Simple per-pixel chroma-key replacement.
 * Matches each pixel against `targetColor` in HSV space using `tolerance`,
 * then replaces matches with the `background` pixel at the same coordinate.
 * Returns a new ImageData.
 */
export function processFrame(
  frame: ImageData,
  background: ImageData,
  targetColor: [number, number, number],
  tolerance: number,
): ImageData {
  if (frame.width !== background.width || frame.height !== background.height) {
    throw new Error(
      `Frame dimensions (${frame.width}x${frame.height}) must match background dimensions (${background.width}x${background.height})`,
    );
  }

  const { data, width, height } = frame;
  const bgData = background.data;
  const output = new Uint8ClampedArray(data.length);
  output.set(data);

  const tr = targetColor[0] / 255;
  const tg = targetColor[1] / 255;
  const tb = targetColor[2] / 255;

  const tMax = Math.max(tr, tg, tb);
  const tMin = Math.min(tr, tg, tb);
  const td = tMax - tMin;

  let th = 0;
  if (td !== 0) {
    if (tMax === tr) {
      th = ((tg - tb) / td + (tg < tb ? 6 : 0)) / 6;
    } else if (tMax === tg) {
      th = ((tb - tr) / td + 2) / 6;
    } else {
      th = ((tr - tg) / td + 4) / 6;
    }
  }
  const ts = tMax === 0 ? 0 : td / tMax;
  const tv = tMax;

  const thDeg = th * 360;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;

    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
      if (max === rf) {
        h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6;
      } else if (max === gf) {
        h = ((bf - rf) / d + 2) / 6;
      } else {
        h = ((rf - gf) / d + 4) / 6;
      }
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;

    const hDeg = h * 360;
    const hueDiff = Math.min(Math.abs(hDeg - thDeg), 360 - Math.abs(hDeg - thDeg));
    const dh = (hueDiff / 360) * 255;
    const ds = Math.abs(s - ts) * 255;
    const dv = Math.abs(v - tv) * 255;

    const dist = Math.sqrt(dh * dh * 2.1 + ds * ds * 0.85 + dv * dv * 0.05);

    if (dist <= tolerance) {
      output[i] = bgData[i];
      output[i + 1] = bgData[i + 1];
      output[i + 2] = bgData[i + 2];
      output[i + 3] = bgData[i + 3];
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Full chroma-key pipeline with morphological cleanup:
 *   1. Build binary match mask
 *   2. Erode mask (remove isolated specks)
 *   3. Dilate mask (fill small holes)
 *   4. Apply cleaned mask to produce output
 *
 * Reuses internal buffers to eliminate GC collection overhead entirely.
 */
export function applyCloakEffect(
  frame: ImageData,
  background: ImageData,
  targetColor: [number, number, number],
  tolerance: number,
): ImageData {
  if (frame.width !== background.width || frame.height !== background.height) {
    throw new Error(
      `Frame dimensions (${frame.width}x${frame.height}) must match background dimensions (${background.width}x${background.height})`,
    );
  }

  const { width, height } = frame;
  ensureBuffers(width, height);

  const mask = cachedMask!;
  const eroded = cachedEroded!;
  const cleaned = cachedCleaned!;
  const output = cachedOutput!;
  const imageData = cachedImageData!;

  buildMask(frame, targetColor, tolerance, mask);
  erodeMask(mask, width, height, eroded);
  dilateMask(eroded, width, height, cleaned);
  applyMask(frame.data, background.data, cleaned, output);

  return imageData;
}
