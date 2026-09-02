import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    categories: [{ type: String }], // problem categories routed to this department
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
