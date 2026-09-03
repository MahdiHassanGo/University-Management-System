import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import { ResultController } from "./result.controller.js";

const router = Router();

router.get("/me", checkAuth("STUDENT"), ResultController.getMyPublishedResults);

export const ResultRoutes = router;
