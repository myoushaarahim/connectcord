import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  listUsers,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", requireAuth, getCurrentUser);
router.get("/users", requireAuth, listUsers);

export default router;
