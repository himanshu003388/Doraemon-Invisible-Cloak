# Invisibility Cloak

Browser-based invisibility cloak using HSV chroma-key. Captures your webcam,
lets you select a cloth color, and replaces that color with a pre-captured
background — making the cloth appear invisible.

**Privacy:** All processing is client-side. No data ever leaves your browser.
No uploads, no tracking, no storage.

## Setup

```bash
npm install
npm run dev        # Dev server at http://localhost:8080
npm run build      # Production build → dist/
npm run test       # Unit tests (Vitest)
npm run test:e2e   # E2E smoke test (Playwright)
npm run lint       # TypeScript type check
```

## Browser Support

| Feature | Requirement |
|---|---|
| Camera | `getUserMedia` — Chrome, Firefox, Edge, Safari 16+ |
| EyeDropper API | Chrome 95+, Edge 95+ (fallback: click-to-sample on canvas) |
| Recording | `canvas.captureStream` + `MediaRecorder` — Chrome, Firefox, Edge |
| Access | **HTTPS or localhost** required (browser-enforced for camera) |

`file://` protocol will **not** work — camera access requires a secure context.

## Architecture

```
src/engine/cloakEngine.ts    Pure functions: ImageData → ImageData
src/hooks/                   React hooks (camera, render loop, recorder)
src/components/              React components (controls, color picker, canvas)
src/context/CloakContext.tsx  State management via useReducer
```

## Known Limitations

- Works best with **solid, evenly-lit, matte-colored cloth** (green, blue, red).
- **Shiny, reflective, or patterned fabrics** will have inconsistent keying.
- **Skin-tone-adjacent colors** (brown, orange) may cause false positives.
- **Fast motion** may show tearing at cloth edges (morphological cleanup mitigates this).
- **Low light** increases noise and reduces HSV matching accuracy.
