import Workspace from "../models/Workspace.js";

// In-memory registry: each user can have more than one open browser/tab.
const clientsByUser = new Map();

export const addSseClient = (userId, response) => {
  const key = String(userId);
  if (!clientsByUser.has(key)) clientsByUser.set(key, new Set());
  clientsByUser.get(key).add(response);
  return () => {
    const clients = clientsByUser.get(key);
    if (!clients) return;
    clients.delete(response);
    if (clients.size === 0) clientsByUser.delete(key);
  };
};

export const sendUserEvent = (userId, eventName, payload) => {
  const clients = clientsByUser.get(String(userId));
  if (!clients) return;
  const frame = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const response of clients) {
    try { response.write(frame); } catch { clients.delete(response); }
  }
};

export const notifyWorkspaceMembers = async (workspaceId, excludedUserId, notification) => {
  try {
    const workspace = await Workspace.findById(workspaceId).select("members").lean();
    if (!workspace) return;
    for (const memberId of workspace.members) {
      if (String(memberId) === String(excludedUserId)) continue;
      sendUserEvent(memberId, "notification", notification);
    }
  } catch (error) {
    console.error("SSE workspace notification failed:", error.message);
  }
};
