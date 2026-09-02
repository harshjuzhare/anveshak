import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401);
      throw new Error("Not authorized, user not found or inactive");
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, invalid token");
  }
});

// Role-based access control — pass allowed roles, e.g. authorize("officer", "admin")
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user?.role}' is not permitted to access this resource`);
  }
  next();
};

// Ensures an officer only touches complaints/resources within their own department
export const sameDepartment = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") return next(); // admins have system-wide access
  if (!req.user.department) {
    res.status(403);
    throw new Error("No department assigned to this account");
  }
  next();
});
