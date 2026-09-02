import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/reportController.js";

const router = express.Router();

router.post("/generate", protect, authorize("officer"), ctrl.generateDepartmentReport);
router.get("/", protect, authorize("officer", "admin"), ctrl.listDepartmentReports);
router.get("/analytics", protect, authorize("admin"), ctrl.systemAnalytics);

export default router;
