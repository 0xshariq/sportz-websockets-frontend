# Sportz Live Dashboard Frontend

Sportz is a React + TypeScript + Vite dashboard for monitoring live sports matches. It loads match data and commentary from the Sportz backend over REST, then listens for score, commentary, and newly-created-match events over WebSocket.

## What the frontend does

- Displays scheduled, live, and finished matches with team scores.
- Normalizes backend status values so completed matches are shown as **Finished**.
- Shows each match date plus clearly labeled **Start** and **End** times in the viewer's local timezone.
- Polls the match API every five seconds so the dashboard remains useful if a WebSocket reconnects.
- Connects to the WebSocket with automatic exponential-backoff reconnects.
- Lets users watch a live match and view its commentary feed.
- Preserves live score updates while REST data refreshes.

## Backend

This frontend consumes the Sportz backend API and WebSocket service:

[Sportz WebSockets Backend](https://github.com/0xshariq/sportz-websockets-backend)

## Configuration

Create a `.env.local` file when you need to override the deployed defaults:

```bash
VITE_API_BASE_URL=https://sportz-websockets-backend.vercel.app
VITE_WS_BASE_URL=wss://sportz-websockets-backend.vercel.app/ws
```

The app falls back to these same backend URLs when the variables are not set.

## Local development

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Validation

```bash
npm run lint
npm run build
```

## Connection behavior

A WebSocket disconnect is treated as a recoverable transport event. The header shows **Syncing** while the client reconnects instead of presenting a permanent offline/live-updates-unavailable error. REST polling continues independently, and the connection automatically returns to **Live** after the WebSocket opens again.
