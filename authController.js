import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { generateToken } from "../utils/generateToken.js";
import AuditLog from "../models/AuditLog.js";

// Public: citizens self-register. Role is hardcoded to "citizen" — it is never
// accepted from the request body, so nobody can register as officer/admin.
export const registerCitizen = asyncHandler(async (req, res) => {
  const { name, email, phone, password, preferredLanguage } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: "citizen",
    preferredLanguage: preferredLanguage || "en",
  });

  res.status(201).json({
    success: true,
    user: sanitize(user),
    token: generateToken(user._id, user.role),
  });
});

// Shared login for all roles (citizen / officer / worker / admin)
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select("+password").populate("department", "name code");

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated. Contact the administrator.");
  }

  res.json({ success: true, user: sanitize(user), token: generateToken(user._id, user.role) });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("department", "name code");
  res.json({ success: true, user: sanitize(user) });
});

export const updateLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;
  req.user.preferredLanguage = language;
  await req.user.save();
  res.json({ success: true, preferredLanguage: language });
});

// Admin-only: create Officer, Worker, or another Admin account
export const createStaffAccount = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, department, designation, skills } = req.body;

  if (!["officer", "worker", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Role must be officer, worker, or admin");
  }
  if ((role === "officer" || role === "worker") && !department) {
    res.status(400);
    throw new Error("Department is required for officer/worker accounts");
  }
  if (department) {
    const dept = await Department.findById(department);
    if (!dept) {
      res.status(400);
      throw new Error("Invalid department");
    }
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    department: department || undefined,
    designation,
    skills,
    createdBy: req.user._id,
  });

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "STAFF_ACCOUNT_CREATED",
    targetType: "User",
    targetId: user._id,
    details: { role, department },
  });

  res.status(201).json({ success: true, user: sanitize(user) });
});

const sanitize = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
};
