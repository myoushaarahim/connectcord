# ConnectCord Phase 5 — Typing indicators and presence

## Included
- `typing:start` / `typing:stop` events scoped to the currently joined channel.
- The frontend shows the names of users typing in the selected channel.
- The backend tracks active sockets per user, so opening multiple tabs doesn't prematurely mark the user offline.
- `presence:changed` broadcasts online/offline changes to other connected sockets.
- Disconnect cleanup removes typing/presence state naturally.

## Run
Keep your current `server/.env` private and configure `MONGO_URI`, `JWT_SECRET`, and optionally `CLIENT_ORIGIN=http://localhost:5173`.
Run `npm install` + `npm run dev` in the root, and `cd server`, `npm install` + `npm run dev` in a second terminal.
Sign in from two browser windows, open the same channel, and type in one window to see the typing indicator in the other.

## Scope note
Presence in this phase is in-memory on a single backend process. It resets if the server restarts and is not yet shared across multiple backend instances; Redis can support that later.
