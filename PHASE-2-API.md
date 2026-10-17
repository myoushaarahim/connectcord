# ConnectCord Phase 2 — Workspace, Channel, and Message APIs

These endpoints require a JWT. After logging in, send the returned token as: `Authorization: Bearer YOUR_TOKEN`.

## Endpoints

| Method | Endpoint | Purpose | JSON body |
|---|---|---|---|
| GET | `/api/workspaces` | List workspaces the signed-in user belongs to | — |
| POST | `/api/workspaces` | Create a workspace and its default `general` channel | `{ "name": "Design Collective", "description": "A place to build together" }` |
| GET | `/api/workspaces/:workspaceId` | Get a workspace, its members, and channels | — |
| GET | `/api/workspaces/:workspaceId/channels` | List channels in a workspace | — |
| POST | `/api/workspaces/:workspaceId/channels` | Create a channel | `{ "name": "design-lab", "description": "Share design work" }` |
| GET | `/api/messages/channels/:channelId` | Read recent messages; optional `?limit=50` (max 100) | — |
| POST | `/api/messages/channels/:channelId` | Save a message | `{ "content": "Hello, ConnectCord!" }` |

## Run it

1. Keep your `server/.env` file (do not upload it or share secrets).
2. Ensure MongoDB is running.
3. In the project root, run `npm install` and `npm run dev`.
4. In another terminal, run `cd server`, `npm install`, and `npm run dev`.
5. Register or log in through the UI to receive a token.

## Notes

- Only authenticated users can use these endpoints.
- Workspace/channel/message access checks confirm the user is a workspace member.
- Creating a workspace automatically creates its `general` channel.
- Messages and workspace data are stored in MongoDB.
- The current UI still contains demo conversation content. The next integration step is to replace that demo content with these APIs, then add Socket.IO for instant updates.
