import { Router } from "express";
import {
  createProblem,
  deleteProblem,
  getProblem,
  listProblems,
  updateProblem
} from "../controllers/problemController.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", listProblems);
router.get("/:id", optionalAuth, getProblem);
router.post("/", requireAuth, requireRole("admin"), createProblem);
router.put("/:id", requireAuth, requireRole("admin"), updateProblem);
router.delete("/:id", requireAuth, requireRole("admin"), deleteProblem);

export default router;
