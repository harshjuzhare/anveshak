import mongoose from "mongoose";
import { COMPLAINT_STATUS, PRIORITY } from "../config/constants.js";

const complaintSchema = new mongoose.Schema
(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
    },

    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Media
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
    },

    // Description (multilingual)
    originalDescription: {
      type: String,
      required: true,
    },
    originalLanguage: {
      type: String,
      default: "en",
    },
    translatedDescription: {
      type: String,
    },

    // AI analysis
    aiCategory: {
      type: String,
      required: true,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    aiExplanation: {
      type: String,
    },
    aiRawResponse: {
      type: mongoose.Schema.Types.Mixed,
    },

    priority: {
      type: String,
      enum: Object.values(PRIORITY),
      default: PRIORITY.MEDIUM,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    // Location
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
      },
    },

    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.SUBMITTED,
    },

    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    workInstructions: {
      type: String,
    },

    deadline: {
      type: Date,
    },

    completionProofUrl: {
      type: String,
    },

    completionDescription: {
      type: String,
    },

    beforeAfterImageUrl: {
      type: String,
    },

    citizenVerified: {
      type: Boolean,
      default: null,
    },

    reopenReason: {
      type: String,
    },

    // Duplicate detection
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },

    relatedComplaints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
      },
    ],

    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
      },
      submittedAt: {
        type: Date,
      },
    },

    isOverdue: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ "location.lat": 1, "location.lng": 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ citizen: 1 });

export default mongoose.model("Complaint", complaintSchema);import mongoose from "mongoose";
import { COMPLAINT_STATUS, PRIORITY } from "../config/constants.js";

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
    },

    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Media
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
    },

    // Description (multilingual)
    originalDescription: {
      type: String,
      required: true,
    },
    originalLanguage: {
      type: String,
      default: "en",
    },
    translatedDescription: {
      type: String,
    },

    // AI analysis
    aiCategory: {
      type: String,
      required: true,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    aiExplanation: {
      type: String,
    },
    aiRawResponse: {
      type: mongoose.Schema.Types.Mixed,
    },

    priority: {
      type: String,
      enum: Object.values(PRIORITY),
      default: PRIORITY.MEDIUM,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    // Location
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
      },
    },

    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.SUBMITTED,
    },

    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    workInstructions: {
      type: String,
    },

    deadline: {
      type: Date,
    },

    completionProofUrl: {
      type: String,
    },

    completionDescription: {
      type: String,
    },

    beforeAfterImageUrl: {
      type: String,
    },

    citizenVerified: {
      type: Boolean,
      default: null,
    },

    reopenReason: {
      type: String,
    },

    // Duplicate detection
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },

    relatedComplaints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
      },
    ],

    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
      },
      submittedAt: {
        type: Date,
      },
    },

    isOverdue: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ "location.lat": 1, "location.lng": 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ citizen: 1 });

export default mongoose.model("Complaint", complaintSchema);