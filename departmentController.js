import asyncHandler from "express-async-handler";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";

export const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, departments });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, categories } = req.body;
  const department = await Department.create({ name, code, description, categories });
  await AuditLog.create({ actor: req.user._id, actorRole: req.user.role, action: "DEPARTMENT_CREATED", targetType: "Department", targetId: department._id });
  res.status(201).json({ success: true, department });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!department) { res.status(404); throw new Error("Department not found"); }
  await AuditLog.create({ actor: req.user._id, actorRole: req.user.role, action: "DEPARTMENT_UPDATED", targetType: "Department", targetId: department._id });
  res.json({ success: true, department });
});

export const deactivateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!department) { res.status(404); throw new Error("Department not found"); }
  res.json({ success: true, department });
});
