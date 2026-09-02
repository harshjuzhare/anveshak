import express from "express";
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, ctrl.getMyNotifications);
router.patch("/:id/read", protect, ctrl.markAsRead);
router.patch("/read-all", protect, ctrl.markAllAsRead);

export default router;
