import { Router } from "express";
import { leaderboard, profile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/profile", protect, profile);
router.get("/leaderboard", leaderboard);

export default router;
