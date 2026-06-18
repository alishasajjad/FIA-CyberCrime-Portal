const mongoose = require("mongoose");

const monthlyItemSchema = new mongoose.Schema(
  {
    year: Number,
    month: Number,
    label: String,
    count: Number,
  },
  { _id: false }
);

const yearlyItemSchema = new mongoose.Schema(
  {
    year: Number,
    label: String,
    count: Number,
  },
  { _id: false }
);

const namedCountSchema = new mongoose.Schema(
  {
    label: String,
    count: Number,
  },
  { _id: false }
);

const userAnalyticsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    scopeRole: {
      type: String,
      enum: ["User", "InvestigationOfficer"],
      required: true,
      index: true,
    },
    totalComplaints: { type: Number, default: 0 },
    monthlyCounts: { type: [monthlyItemSchema], default: [] },
    yearlyCounts: { type: [yearlyItemSchema], default: [] },
    categoryStats: { type: [namedCountSchema], default: [] },
    pieChartData: { type: [namedCountSchema], default: [] },
    statusSummary: { type: [namedCountSchema], default: [] },
    sourceCount: { type: Number, default: 0 },
    sourceMaxUpdatedAt: { type: Date, default: null },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "user_analytics" }
);

userAnalyticsSchema.index({ user: 1, scopeRole: 1 }, { unique: true });

module.exports = mongoose.model("UserAnalytics", userAnalyticsSchema);

