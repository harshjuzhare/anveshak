import express from "express";
import { registerCitizen, login, getMe, updateLanguage, createStaffAccount } from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerCitizen);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/language", protect, updateLanguage);
router.post("/staff", protect, authorize("admin"), createStaffAccount);

export default router;
