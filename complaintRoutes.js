import express from "express";
import { protect, authorize, sameDepartment } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import * as ctrl from "../controllers/complaintController.js";

const router = express.Router();

// Citizen: report flow
router.post("/analyze", protect, authorize("citizen"), upload.single("image"), ctrl.previewAnalysis);
router.post("/", protect, authorize("citizen"), ctrl.createComplaint);
router.get("/mine", protect, authorize("citizen"), ctrl.getMyComplaints);
router.post("/:id/verify", protect, authorize("citizen"), ctrl.citizenVerify);
router.post("/:id/feedback", protect, authorize("citizen"), ctrl.submitFeedback);

// Officer/Admin/Worker: shared listing + detail (role-scoped inside controller)
router.get("/", protect, authorize("officer", "admin", "worker"), ctrl.listComplaints);
router.get("/:id", protect, ctrl.getComplaintById);

// Officer actions
router.post("/:id/review", protect, authorize("officer"), sameDepartment, ctrl.reviewComplaint);
router.post("/:id/assign-officer", protect, authorize("officer"), sameDepartment, ctrl.assignOfficer);
router.post("/:id/assign-worker", protect, authorize("officer"), sameDepartment, ctrl.assignWorker);
router.post("/:id/verify-completion", protect, authorize("officer"), sameDepartment, ctrl.verifyCompletion);

// Worker actions
router.post("/:id/start-work", protect, authorize("worker"), ctrl.startWork);
router.post("/:id/complete", protect, authorize("worker"), upload.single("proof"), ctrl.submitWorkerCompletion);

export default router;
