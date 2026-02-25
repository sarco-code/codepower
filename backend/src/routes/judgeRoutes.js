import { Router } from "express";
import { handleJudgeCallback } from "../controllers/submissionController.js";

const router = Router();

router.post("/callback", handleJudgeCallback);

export default router;
