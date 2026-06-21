# Security Policy

## Threat Model

The primary sensitive asset in this application is **live camera video feed**.

### Mitigation

- **All processing is client-side.** No video frame, ImageData, or pixel information is ever
  transmitted to a server, API, or third party. The entire chroma-key algorithm runs in
  the browser's main thread via `requestAnimationFrame` and raw `ImageData` manipulation.
- **No data leaves the device.** There is no backend, no telemetry, no analytics, no
  cookies, and no local storage of camera data.
- **Camera permission requires explicit user action.** `getUserMedia` is called only
  when the user clicks the "Start Camera" button — never on page load.
- **Strict Content Security Policy (CSP)** is configured in the Vite production build
  to block inline scripts and restrict resource loading to same-origin sources.
- **HTTPS is required** for camera access. The app will refuse to load camera stream
  over HTTP (browser-enforced). Use `https://` or `http://localhost` for development.
- **No third-party dependencies with network access** are included. All dependencies
  are build-time only (React, TypeScript, Vite) or testing-only (Vitest, Playwright).

## Reporting a Vulnerability

This is a client-side utility with no backend. If you discover a security issue,
please open an issue on the project repository.
