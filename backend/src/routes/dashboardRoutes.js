import { Router } from "express";
import { getDashboard, getUsersLeaderboard } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getDashboard);
router.get("/users", requireAuth, getUsersLeaderboard);

export default router;
