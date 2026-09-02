import asyncHandler from "express-async-handler";
import Complaint from "../models/Complaint.js";
import ComplaintStatusHistory from "../models/ComplaintStatusHistory.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { uploadBufferToCloudinary } from "../services/cloudinaryService.js";
import { analyzeComplaint, resolveDepartmentName } from "../services/aiService.js";
import { detectAndTranslate } from "../services/translationService.js";
import { generateComplaintId } from "../utils/generateComplaintId.js";
import { distanceInMeters } from "../utils/distance.js";
import { COMPLAINT_STATUS, STATUS_TRANSITIONS } from "../config/constants.js";

const DUPLICATE_RADIUS_METERS = 60;

// Step 1 (pre-submission): analyze an uploaded image + description before the citizen
// confirms. Nothing is saved to the DB yet — this powers the "AI Analysis Confirmation Screen".
export const previewAnalysis = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("An image is required");
  }
  const { description } = req.body;
  if (!description) {
    res.status(400);
    throw new Error("A description is required");
  }

  const { detectedLanguage, translatedText } = await detectAndTranslate(description);
  const imageBase64 = req.file.buffer.toString("base64");
  const analysis = await analyzeComplaint({
    imageBase64,
    mimeType: req.file.mimetype,
    description: translatedText,
  });

  const departmentName = resolveDepartmentName(analysis.category);
  const department = await Department.findOne({ name: departmentName });

  // Upload now so the confirmation screen can show the real hosted image;
  // if the citizen cancels, the orphaned image can be cleaned up by a scheduled job.
  const uploadResult = await uploadBufferToCloudinary(req.file.buffer);

  res.json({
    success: true,
    analysis: {
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      originalDescription: description,
      originalLanguage: detectedLanguage,
      translatedDescription: translatedText,
      aiCategory: analysis.category,
      aiConfidence: analysis.confidence,
      aiExplanation: analysis.explanation,
      priority: analysis.priority,
      recommendedDepartment: department ? { id: department._id, name: department.name } : null,
    },
  });
});

// Step 2: final submission after citizen reviews/edits the AI analysis confirmation screen
export const createComplaint = asyncHandler(async (req, res) => {
  const {
    imageUrl,
    imagePublicId,
    originalDescription,
    originalLanguage,
    translatedDescription,
    aiCategory,
    aiConfidence,
    aiExplanation,
    priority,
    departmentId,
    lat,
    lng,
    address,
  } = req.body;

  if (!imageUrl || !originalDescription || !departmentId || lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error("Missing required complaint fields");
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    res.status(400);
    throw new Error("Invalid department");
  }

  const complaintId = await generateComplaintId();

  const complaint = await Complaint.create({
    complaintId,
    citizen: req.user._id,
    imageUrl,
    imagePublicId,
    originalDescription,
    originalLanguage: originalLanguage || "en",
    translatedDescription,
    aiCategory,
    aiConfidence,
    aiExplanation,
    priority: priority || "Medium",
    department: department._id,
    location: { lat, lng, address },
    status: COMPLAINT_STATUS.SUBMITTED,
  });

  await ComplaintStatusHistory.create({
    complaint: complaint._id,
    newStatus: COMPLAINT_STATUS.SUBMITTED,
    actor: req.user._id,
    actorRole: "citizen",
    comment: "Complaint submitted by citizen",
  });

  // Duplicate/repeated-complaint detection via GPS proximity + same category
  const nearby = await Complaint.find({
    department: department._id,
    aiCategory,
    _id: { $ne: complaint._id },
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  }).select("_id location relatedComplaints");

  const related = nearby.filter(
    (c) => distanceInMeters(c.location.lat, c.location.lng, lat, lng) <= DUPLICATE_RADIUS_METERS
  );
  if (related.length > 0) {
    const relatedIds = related.map((c) => c._id);
    complaint.relatedComplaints = relatedIds;
    complaint.duplicateOf = related[0]._id;
    await complaint.save();
    await Complaint.updateMany(
      { _id: { $in: relatedIds } },
      { $addToSet: { relatedComplaints: complaint._id } }
    );
  }

  res.status(201).json({ success: true, complaint });
});

// GET /api/complaints/mine — citizen's own complaints
export const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ citizen: req.user._id })
    .populate("department", "name code")
    .populate("assignedOfficer", "name")
    .populate("assignedWorker", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, complaints });
});

// GET /api/complaints/:id — full detail + status history + role-based access check
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("citizen", "name email phone")
    .populate("department", "name code")
    .populate("assignedOfficer", "name email")
    .populate("assignedWorker", "name email");

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  const { role, _id, department } = req.user;
  const isOwner = role === "citizen" && complaint.citizen._id.equals(_id);
  const isDeptOfficer = (role === "officer" || role === "worker") && department?.equals(complaint.department._id);
  const isAdmin = role === "admin";

  if (!isOwner && !isDeptOfficer && !isAdmin) {
    res.status(403);
    throw new Error("You do not have access to this complaint");
  }

  const history = await ComplaintStatusHistory.find({ complaint: complaint._id })
    .populate("actor", "name role")
    .sort({ createdAt: 1 });

  res.json({ success: true, complaint, history });
});

// Generic controlled status transition, used by officer/worker/admin actions below.
// Never allows skipping states — validated against STATUS_TRANSITIONS.
const transitionStatus = async ({ complaint, newStatus, actor, comment }) => {
  const allowed = STATUS_TRANSITIONS[complaint.status] || [];
  if (!allowed.includes(newStatus)) {
    const err = new Error(`Cannot move complaint from "${complaint.status}" to "${newStatus}"`);
    err.statusCode = 400;
    throw err;
  }
  const previousStatus = complaint.status;
  complaint.status = newStatus;
  await complaint.save();

  await ComplaintStatusHistory.create({
    complaint: complaint._id,
    previousStatus,
    newStatus,
    actor: actor._id,
    actorRole: actor.role,
    comment,
  });

  await Notification.create({
    user: complaint.citizen,
    complaint: complaint._id,
    title: `Complaint ${complaint.complaintId} updated`,
    message: `Status changed to "${newStatus}"${comment ? `: ${comment}` : ""}`,
    type: "status_update",
  });
};

// Officer: accept/review a submitted complaint
export const reviewComplaint = asyncHandler(async (req, res) => {
  const complaint = await getDeptComplaintOr404(req);
  await transitionStatus({
    complaint,
    newStatus: COMPLAINT_STATUS.UNDER_REVIEW,
    actor: req.user,
    comment: req.body.comment,
  });
  res.json({ success: true, complaint });
});

// Officer: formally take ownership of the complaint
export const assignOfficer = asyncHandler(async (req, res) => {
  const complaint = await getDeptComplaintOr404(req);
  complaint.assignedOfficer = req.user._id;
  if (req.body.deadline) complaint.deadline = req.body.deadline;
  await transitionStatus({
    complaint,
    newStatus: COMPLAINT_STATUS.ASSIGNED_TO_OFFICER,
    actor: req.user,
    comment: "Officer assigned to complaint",
  });
  res.json({ success: true, complaint });
});

// Officer: assign a worker from their department
export const assignWorker = asyncHandler(async (req, res) => {
  const { workerId, instructions, deadline } = req.body;
  const complaint = await getDeptComplaintOr404(req);

  complaint.assignedWorker = workerId;
  complaint.workInstructions = instructions;
  if (deadline) complaint.deadline = deadline;

  await transitionStatus({
    complaint,
    newStatus: COMPLAINT_STATUS.WORKER_ASSIGNED,
    actor: req.user,
    comment: `Worker assigned: ${instructions || ""}`,
  });

  await Notification.create({
    user: workerId,
    complaint: complaint._id,
    title: "New task assigned",
    message: `You have been assigned complaint ${complaint.complaintId}`,
    type: "assignment",
  });

  res.json({ success: true, complaint });
});


// Worker: mark work as started
export const startWork = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error("Complaint not found"); }
  if (!complaint.assignedWorker?.equals(req.user._id)) {
    res.status(403); throw new Error("This task is not assigned to you");
  }
  await transitionStatus({ complaint, newStatus: COMPLAINT_STATUS.WORK_IN_PROGRESS, actor: req.user });
  res.json({ success: true, complaint });
});

// Worker: upload completion proof photo
export const submitWorkerCompletion = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error("Complaint not found"); }
  if (!complaint.assignedWorker?.equals(req.user._id)) {
    res.status(403); throw new Error("This task is not assigned to you");
  }
  if (!req.file) { res.status(400); throw new Error("Completion photo is required"); }

  const uploadResult = await uploadBufferToCloudinary(req.file.buffer, "civicai/completions");
  complaint.completionProofUrl = uploadResult.secure_url;

  await transitionStatus({
    complaint,
    newStatus: COMPLAINT_STATUS.WORK_COMPLETED,
    actor: req.user,
    comment: req.body.notes || "Worker submitted completion evidence",
  });

  res.json({ success: true, complaint });
});

// Officer: review worker's evidence, add completion description, move to verification-pending
export const verifyCompletion = asyncHandler(async (req, res) => {
  const complaint = await getDeptComplaintOr404(req);
  const { completionDescription, beforeAfterImageUrl } = req.body;

  complaint.completionDescription = completionDescription;
  if (beforeAfterImageUrl) complaint.beforeAfterImageUrl = beforeAfterImageUrl;

  await transitionStatus({
    complaint,
    newStatus: COMPLAINT_STATUS.VERIFICATION_PENDING,
    actor: req.user,
    comment: "Officer verified worker completion; awaiting citizen confirmation",
  });

  await Notification.create({
    user: complaint.citizen,
    complaint: complaint._id,
    title: "Your problem has been fixed — please confirm",
    message: `The ${complaint.aiCategory.replace("_", " ")} reported in ${complaint.complaintId} has been marked complete. Please review and confirm.`,
    type: "completion",
  });

  res.json({ success: true, complaint });
});

// Citizen: confirm or reject the resolution
export const citizenVerify = asyncHandler(async (req, res) => {
  const { confirmed, reason, reopenImageUrl } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error("Complaint not found"); }
  if (!complaint.citizen.equals(req.user._id)) { res.status(403); throw new Error("Not your complaint"); }

  complaint.citizenVerified = !!confirmed;

  if (confirmed) {
    await transitionStatus({ complaint, newStatus: COMPLAINT_STATUS.RESOLVED, actor: req.user, comment: "Citizen confirmed resolution" });
  } else {
    complaint.reopenReason = reason;
    if (reopenImageUrl) complaint.imageUrl = reopenImageUrl;
    await transitionStatus({ complaint, newStatus: COMPLAINT_STATUS.REOPENED, actor: req.user, comment: reason || "Citizen rejected the resolution" });
  }

  res.json({ success: true, complaint });
});

// Citizen: star rating + feedback after resolution
export const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error("Complaint not found"); }
  if (!complaint.citizen.equals(req.user._id)) { res.status(403); throw new Error("Not your complaint"); }
  if (complaint.status !== COMPLAINT_STATUS.RESOLVED) {
    res.status(400); throw new Error("Feedback can only be given after resolution");
  }

  complaint.feedback = { rating, comment, submittedAt: new Date() };
  if (complaint.status !== COMPLAINT_STATUS.CLOSED) {
    await transitionStatus({ complaint, newStatus: COMPLAINT_STATUS.CLOSED, actor: req.user, comment: "Feedback submitted; complaint closed" });
  } else {
    await complaint.save();
  }

  res.json({ success: true, complaint });
});

// Officer/Admin: department (or system-wide) complaint listing with filters
export const listComplaints = asyncHandler(async (req, res) => {
  const { status, priority, category, from, to, search, overdue } = req.query;
  const filter = {};

  if (req.user.role === "officer" || req.user.role === "worker") {
    filter.department = req.user.department;
    if (req.user.role === "worker") filter.assignedWorker = req.user._id;
  }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.aiCategory = category;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (overdue === "true") {
    filter.deadline = { $lt: new Date() };
    filter.status = { $nin: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] };
  }
  if (search) {
    filter.$or = [
      { complaintId: new RegExp(search, "i") },
      { "location.address": new RegExp(search, "i") },
      { originalDescription: new RegExp(search, "i") },
    ];
  }

  const complaints = await Complaint.find(filter)
    .populate("citizen", "name")
    .populate("department", "name code")
    .populate("assignedOfficer", "name")
    .populate("assignedWorker", "name")
    .sort({ createdAt: -1 })
    .limit(500);

  res.json({ success: true, count: complaints.length, complaints });
});

const getDeptComplaintOr404 = async (req) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { const e = new Error("Complaint not found"); e.statusCode = 404; throw e; }
  if (req.user.role !== "admin" && !complaint.department.equals(req.user.department)) {
    const e = new Error("This complaint does not belong to your department"); e.statusCode = 403; throw e;
  }
  return complaint;
};
