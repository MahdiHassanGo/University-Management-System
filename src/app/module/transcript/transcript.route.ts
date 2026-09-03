import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import { TranscriptController } from "./transcript.controller.js";

const router = Router();

router.get("/me", checkAuth("STUDENT"), TranscriptController.getMyTranscript);

router.get(
  "/students/:studentId",
  checkAuth("SUPER_ADMIN"),
  TranscriptController.getStudentTranscript,
);

export const TranscriptRoutes = router;
