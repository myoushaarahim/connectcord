import express from "express";
import {
  createMessage,
  listMessages,
  toggleReaction,
  getOrCreateDMChannel,
  listDMs,
  uploadAttachment,
} from "../controllers/messageController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);
router.post("/upload", uploadAttachment);
router.get("/dms", listDMs);
router.get("/dm/:recipientId", getOrCreateDMChannel);
router.get("/channels/:channelId", listMessages);
router.post("/channels/:channelId", createMessage);
router.post("/:messageId/reactions", toggleReaction);
export default router;
