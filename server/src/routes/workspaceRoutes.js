import express from "express";
import { createWorkspace, deleteWorkspace, getWorkspace, joinWorkspace, listWorkspaces } from "../controllers/workspaceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", listWorkspaces);
router.post("/", createWorkspace);
router.post("/join", joinWorkspace);
router.get("/:workspaceId", getWorkspace);
router.delete("/:workspaceId", deleteWorkspace);
export default router;
