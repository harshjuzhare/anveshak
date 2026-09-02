import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/staffController.js";

const router = express.Router();

router.get("/workers", protect, authorize("officer", "admin"), ctrl.listDepartmentWorkers);
router.get("/officers", protect, authorize("officer", "admin"), ctrl.listOfficers);
router.patch("/:id/active", protect, authorize("admin"), ctrl.setStaffActive);
router.get("/my-tasks", protect, authorize("worker"), ctrl.myTasks);

export default router;
