import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";

// Officer: list workers in their own department (used by the Worker Assignment System)
export const listDepartmentWorkers = asyncHandler(async (req, res) => {
  const departmentId = req.user.role === "admin" ? req.query.department : req.user.department;
  if (!departmentId) { res.status(400); throw new Error("Department is required"); }

  const workers = await User.find({ role: "worker", department: departmentId, isActive: true }).select(
    "name email phone skills currentWorkload"
  );
  res.json({ success: true, workers });
});

// Officer/Admin: list officers (for admin oversight or reassignment)
export const listOfficers = asyncHandler(async (req, res) => {
  const filter = { role: "officer" };
  if (req.user.role !== "admin") filter.department = req.user.department;
  else if (req.query.department) filter.department = req.query.department;

  const officers = await User.find(filter).select("name email phone department designation").populate("department", "name");
  res.json({ success: true, officers });
});

// Admin: deactivate/reactivate any staff account
export const setStaffActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select("-password");
  if (!user) { res.status(404); throw new Error("User not found"); }
  res.json({ success: true, user });
});

// Worker: my current tasks
export const myTasks = asyncHandler(async (req, res) => {
  const tasks = await Complaint.find({ assignedWorker: req.user._id })
    .populate("department", "name")
    .sort({ deadline: 1, createdAt: -1 });
  res.json({ success: true, tasks });
});
