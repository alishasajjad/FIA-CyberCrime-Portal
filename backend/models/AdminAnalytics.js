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

const adminAnalyticsSchema = new mongoose.Schema(
  {
    scopeKey: { type: String, default: "global", unique: true, index: true },
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
  { timestamps: true, collection: "admin_analytics" }
);

module.exports = mongoose.model("AdminAnalytics", adminAnalyticsSchema);

