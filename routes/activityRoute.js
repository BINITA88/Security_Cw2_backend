const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const { bookishProtectAuth, isAdmin, adminGuard } = require("../middleware/protect");

// Get all user activities (Admin only)
router.get("/activities", activityController.getAllUserActivities);

// Delete a user (Admin only)
router.delete("/delete_user/:userId", activityController.deleteUser);

module.exports = router;
