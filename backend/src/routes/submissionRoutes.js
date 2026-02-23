import { Router } from "express";
import {
  createSubmission,
  getSubmissionDetails,
  listAllSubmissions,
  listMySubmissions
} from "../controllers/submissionController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listMySubmissions);
router.get("/admin/all", requireRole("admin"), listAllSubmissions);
router.get("/:id", getSubmissionDetails);
router.post("/", createSubmission);

export default router;
