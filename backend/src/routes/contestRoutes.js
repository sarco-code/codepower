import { Router } from "express";
import {
  createContest,
  deleteContest,
  getContest,
  listContests,
  updateContest
} from "../controllers/contestController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", listContests);
router.get("/:id", getContest);
router.post("/", requireAuth, requireRole("admin"), createContest);
router.put("/:id", requireAuth, requireRole("admin"), updateContest);
router.delete("/:id", requireAuth, requireRole("admin"), deleteContest);

export default router;
