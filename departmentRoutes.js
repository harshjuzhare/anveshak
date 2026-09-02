import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/departmentController.js";

const router = express.Router();

router.get("/", protect, ctrl.listDepartments);
router.post("/", protect, authorize("admin"), ctrl.createDepartment);
router.patch("/:id", protect, authorize("admin"), ctrl.updateDepartment);
router.delete("/:id", protect, authorize("admin"), ctrl.deactivateDepartment);

export default router;
