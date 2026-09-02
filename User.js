import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["citizen", "officer", "worker", "admin"], default: "citizen", required: true },
    preferredLanguage: { type: String, default: "en" },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },

    // Officer-only
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    designation: { type: String },

    // Worker-only
    skills: [{ type: String }],
    currentWorkload: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // for officer/worker accounts created by admin/officer
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

export default mongoose.model("User", userSchema);
