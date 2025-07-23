const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  action: { type: String, required: true },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now },
  severity: {
    type: String,
    enum: ["INFO", "WARN", "FATAL"],
    default: "INFO",
  },
  method: { type: String },
  details: { type: Object },
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
