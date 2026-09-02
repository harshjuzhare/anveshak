import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["status_update", "assignment", "completion", "system", "escalation"], default: "system" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
