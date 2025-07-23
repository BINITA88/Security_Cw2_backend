const ActivityLog = require("../models/activityLogModel");
const geoip = require("geoip-lite");
const useragent = require("useragent");

const logActivity = async (req, userId, action, severity = "INFO", details = {}) => {
  try {
    const ip = req.ip === "::1" ? "127.0.0.1" : req.ip;
    const agent = useragent.parse(req.headers["user-agent"]);
    const location = geoip.lookup(ip) || {};

    await ActivityLog.create({
      user: userId,
      action,
      ipAddress: ip,
      method: req.method,
      severity,
      timestamp: new Date(),
      details: {
        ...details,
        userAgent: req.headers["user-agent"],
        device: {
          os: agent.os.toString(),
          browser: agent.toAgent(),
          platform: agent.device.toString(),
        },
        location,
      },
    });
  } catch (err) {
    console.error("❌ Failed to log activity:", err.message);
  }
};

module.exports = { logActivity };
