import express from "express";
import { createMessage, listMessages } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/channels/:channelId", listMessages);
router.post("/channels/:channelId", createMessage);
export default router;
