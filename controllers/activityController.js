// controllers/activityController.js
const ActivityLog = require("../models/activityLogModel");
const User = require("../models/userModel");
const { logActivity } = require("../service/logService");

const getAllUserActivities = async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .populate("user", "userName email phoneNumber")
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(userId);
    await ActivityLog.deleteMany({ user: userId });

    await logActivity(req, req.user._id, "admin_delete_user", "WARN", {
      deletedEmail: user.email,
    });

    res.status(200).json({
      success: true,
      message: "User and their activities deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { getAllUserActivities, deleteUser };


// const ActivityLog = require("../models/activityLogModel");
// const User = require("../models/userModel");
// const geoip = require("geoip-lite");
// const useragent = require("useragent");

// // 📌 Utility function to log activity securely
// const logActivity = async (req, userId, action, email) => {
//   try {
//     const ip = req.ip === "::1" ? "127.0.0.1" : req.ip;
//     const location = geoip.lookup(ip) || {};
//     const agent = useragent.parse(req.headers["user-agent"]);

//     await ActivityLog.create({
//       user: userId,
//       action: action,
//       ipAddress: ip,
//       timestamp: new Date(),
//       details: {
//         email: email,
//         userAgent: req.headers["user-agent"],
//         location: {
//           country: location.country || "",
//           city: location.city || "",
//           region: location.region || "",
//           timezone: location.timezone || "",
//         },
//         device: {
//           os: agent.os.toString(), // e.g. "Windows 10"
//           browser: agent.toAgent(), // e.g. "Chrome 114.0.0"
//           platform: agent.device.toString(), // e.g. "Other 0.0.0"
//         },
//       },
//     });
//   } catch (err) {
//     console.error("❌ Failed to log activity:", err.message);
//   }
// };

// // ✅ Get all user activities (Admin only)
// const getAllUserActivities = async (req, res) => {
//   try {
//     const activities = await ActivityLog.find()
//       .populate("user", "firstName lastName userName email phoneNumber")
//       .sort({ timestamp: -1 });

//     res.status(200).json({
//       success: true,
//       activities,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// // ✅ Delete a user and their activities
// const deleteUser = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     await User.findByIdAndDelete(userId);
//     await ActivityLog.deleteMany({ user: userId });

//     // ✅ Log admin delete activity
//     await logActivity(req, req.user._id, "admin_delete_user", user.email);

//     res.status(200).json({
//       success: true,
//       message: "User and their activities deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// module.exports = { getAllUserActivities, deleteUser, logActivity };
