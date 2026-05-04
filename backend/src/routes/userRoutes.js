import { Router } from "express";
import { leaderboard, profile, updateAvatar } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/profile", protect, profile);
router.patch("/avatar", protect, updateAvatar);
router.get("/leaderboard", leaderboard);

export default router;
