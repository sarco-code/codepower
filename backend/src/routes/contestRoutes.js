import { Router } from "express";
import {
  createContest,
  deleteContest,
  getContest,
  listContests,
  markContestParticipant,
  updateContest
} from "../controllers/contestController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", listContests);
router.get("/:id", getContest);
router.patch("/:id/participants/:userId", requireAuth, requireRole("admin"), markContestParticipant);
router.post("/", requireAuth, requireRole("admin"), createContest);
router.put("/:id", requireAuth, requireRole("admin"), updateContest);
router.delete("/:id", requireAuth, requireRole("admin"), deleteContest);

export default router;
