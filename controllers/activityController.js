const Activity = require('../models/Activity');

// @desc    Get all activities
// @route   GET /api/activities
// @access  Public
exports.getAllActivities = async (req, res) => {
  try {
    const { limit = 50, prId } = req.query;

    let query = {};
    if (prId) {
      query.prId = prId;
    }

    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message,
    });
  }
};

// @desc    Create activity
// @route   POST /api/activities
// @access  Public
exports.createActivity = async (req, res) => {
  try {
    const { action, details, prId } = req.body;

    const activity = await Activity.create({
      action,
      details,
      prId: prId || null,
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating activity',
      error: error.message,
    });
  }
};

// @desc    Delete old activities
// @route   DELETE /api/activities/cleanup
// @access  Public
exports.cleanupActivities = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await Activity.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} activities older than ${days} days`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cleaning up activities',
      error: error.message,
    });
  }
};