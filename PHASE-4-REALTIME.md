# ConnectCord Phase 4 — Socket.IO real-time messaging

## What's added
- Socket.IO server attached to the same HTTP server as Express.
- Socket connections authenticate using the existing JWT.
- Authenticated users can join only channels belonging to workspaces they are members of.
- New messages are broadcast to the channel room after MongoDB has saved them.
- React listens for `message:new` and avoids duplicate message entries.
- The existing UI displays a subtle live-connection status.

## Run
1. Keep your existing `server/.env` (do not share it). It needs `MONGO_URI`, `JWT_SECRET`, and optionally `CLIENT_ORIGIN=http://localhost:5173`.
2. In the project root: `npm install` then `npm run dev`.
3. In another terminal: `cd server`, then `npm install` and `npm run dev`.
4. Sign in and open the same workspace/channel in two browser windows. Send a message in one; it should appear in both.

## Notes
Messages still use the authenticated REST API for persistence. Socket.IO delivers the saved message to connected clients in real time. If a client is offline, it loads missed messages from the REST history endpoint when the channel is opened again.
