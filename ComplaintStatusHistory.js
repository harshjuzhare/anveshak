import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true },
    previousStatus: { type: String },
    newStatus: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

historySchema.index({ complaint: 1, createdAt: 1 });

export default mongoose.model("ComplaintStatusHistory", historySchema);
