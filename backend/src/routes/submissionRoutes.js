import { Router } from "express";
import {
  createSubmission,
  getSubmissionDetails,
  listMySubmissions
} from "../controllers/submissionController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listMySubmissions);
router.get("/:id", getSubmissionDetails);
router.post("/", createSubmission);

export default router;
