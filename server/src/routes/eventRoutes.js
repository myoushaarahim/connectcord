import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { addSseClient } from "../sse/eventHub.js";

const router = express.Router();
router.get("/stream", requireAuth, (req, res) => {
  res.status(200);
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write(`event: connected\ndata: ${JSON.stringify({ userId: req.userId, connectedAt: new Date().toISOString() })}\n\n`);

  const removeClient = addSseClient(req.userId, res);
  const keepAlive = setInterval(() => {
    if (!res.writableEnded) res.write(`: keep-alive ${Date.now()}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAlive);
    removeClient();
  });
});
export default router;
