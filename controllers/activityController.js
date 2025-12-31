const Activity = require('../models/Activity');

exports.getAllActivities = async (req, res) => {
  try {
    const { limit = 50, prId, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (prId) {
      query.prId = prId;
    }

    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Activity.countDocuments(query);

    res.status(200).json({
      success: true,
      count: activities.length,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
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