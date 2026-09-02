import asyncHandler from "express-async-handler";
import Complaint from "../models/Complaint.js";
import Report from "../models/Report.js";
import { COMPLAINT_STATUS } from "../config/constants.js";

// Shared aggregation used by both officer department reports and admin system-wide stats
const buildStats = async (filter) => {
  const [total, resolved, pending, inProgress, overdue] = await Promise.all([
    Complaint.countDocuments(filter),
    Complaint.countDocuments({ ...filter, status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] } }),
    Complaint.countDocuments({ ...filter, status: { $in: [COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.UNDER_REVIEW] } }),
    Complaint.countDocuments({ ...filter, status: { $in: [COMPLAINT_STATUS.WORKER_ASSIGNED, COMPLAINT_STATUS.WORK_IN_PROGRESS] } }),
    Complaint.countDocuments({ ...filter, deadline: { $lt: new Date() }, status: { $nin: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] } }),
  ]);

  const categoryAgg = await Complaint.aggregate([{ $match: filter }, { $group: { _id: "$aiCategory", count: { $sum: 1 } } }]);
  const priorityAgg = await Complaint.aggregate([{ $match: filter }, { $group: { _id: "$priority", count: { $sum: 1 } } }]);
  const satisfactionAgg = await Complaint.aggregate([
    { $match: { ...filter, "feedback.rating": { $exists: true } } },
    { $group: { _id: null, avgRating: { $avg: "$feedback.rating" }, count: { $sum: 1 } } },
  ]);

  const resolvedDocs = await Complaint.find({ ...filter, status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] } })
    .select("createdAt updatedAt")
    .limit(1000);
  const avgResolutionHours =
    resolvedDocs.length > 0
      ? resolvedDocs.reduce((sum, c) => sum + (c.updatedAt - c.createdAt) / 36e5, 0) / resolvedDocs.length
      : 0;

  return {
    total,
    resolved,
    pending,
    inProgress,
    overdue,
    avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
    citizenSatisfaction: satisfactionAgg[0]?.avgRating ? Math.round(satisfactionAgg[0].avgRating * 10) / 10 : null,
    categoryDistribution: categoryAgg.map((c) => ({ category: c._id, count: c.count })),
    priorityDistribution: priorityAgg.map((p) => ({ priority: p._id, count: p.count })),
  };
};

// Officer: department-level report, optionally submitted to central admin
export const generateDepartmentReport = asyncHandler(async (req, res) => {
  const stats = await buildStats({ department: req.user.department });
  const report = await Report.create({
    department: req.user.department,
    submittedBy: req.user._id,
    stats,
    status: "submitted",
  });
  res.status(201).json({ success: true, report });
});

export const listDepartmentReports = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { department: req.user.department };
  const reports = await Report.find(filter).populate("department", "name").populate("submittedBy", "name").sort({ createdAt: -1 });
  res.json({ success: true, reports });
});

// Admin: system-wide analytics across all departments
export const systemAnalytics = asyncHandler(async (req, res) => {
  const stats = await buildStats({});
  const byDepartment = await Complaint.aggregate([
    { $group: { _id: "$department", count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ["$status", [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED]] }, 1, 0] } } } },
    { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
    { $unwind: "$dept" },
    { $project: { name: "$dept.name", count: 1, resolved: 1 } },
  ]);

  const trend = await Complaint.aggregate([
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 90 },
  ]);

  res.json({ success: true, stats, byDepartment, trend });
});
