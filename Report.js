import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    stats: { type: mongoose.Schema.Types.Mixed }, // totals, resolved, pending, overdue, avgResolutionTime, satisfaction etc
    status: { type: String, enum: ["draft", "submitted", "reviewed"], default: "submitted" },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
