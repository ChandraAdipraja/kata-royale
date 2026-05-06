import { Router } from "express";
import { listPublicLobbies } from "../controllers/lobbyController.js";

const router = Router();

router.get("/public", listPublicLobbies);

export default router;
