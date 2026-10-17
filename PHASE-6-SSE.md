# ConnectCord Phase 6 — Server-Sent Events (SSE)

## What this phase adds
- An authenticated SSE endpoint at `GET /api/events/stream`.
- A `fetch()` + `ReadableStream` client that sends the JWT in an Authorization header, parses SSE frames, reconnects with exponential backoff, and cancels on sign-out/unmount.
- In-app toast notifications when another workspace member creates a channel or sends a message.
- Workspace rail buttons are generated from the signed-in user's real workspaces.
- Workspace invite codes and a join-workspace flow, so a second account can join the same workspace.
- Live channel-list refresh when another member creates a channel, so new channels appear without refreshing.

## Run
1. Keep your existing `server/.env` private and copy it into the new extracted project's `server/` folder.
2. Start MongoDB.
3. In the project root: `npm install` then `npm run dev`.
4. In another terminal: `cd server`, run `npm install`, then `npm run dev`.
5. Sign in with Account A, create a workspace, and use the share-workspace button beside the workspace name to reveal its invite code.
6. Sign in with Account B in an incognito window. Click the inbox-shaped button under the workspace plus button in the left rail, then enter the invite code.
7. Both accounts should now see the same workspace. When either account creates a channel, the other account should see it without refreshing.

## Test SSE
1. Join Account B to Account A's workspace using the invite code.
2. Open that workspace in both sessions.
3. From Account A, create a channel or send a message.
4. Account B should receive a toast without refreshing, and new channels should appear in its channel list. Socket.IO continues to deliver live channel messages; SSE is used for one-way activity notifications.
5. Sign out or close the tab and confirm the stream is cleaned up. The client reconnects automatically if the network/server drops.

## Security and limitations
- The endpoint uses the existing JWT middleware and a Bearer token header. It does not put tokens in URLs.
- This event registry is in memory, so it works with one backend process. Multi-instance deployment will need shared pub/sub such as Redis.
- Notifications are transient, not stored in MongoDB. A refresh does not replay missed notifications.
- SSE is one-way (server to browser); normal REST APIs and Socket.IO remain in place.
