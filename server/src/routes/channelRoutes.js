import express from "express";
import { createChannel, listChannels } from "../controllers/channelController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.get("/", listChannels);
router.post("/", createChannel);
export default router;
