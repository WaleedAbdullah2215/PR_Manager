const express = require('express');
const router = express.Router();
const {
  getAllActivities,
  createActivity,
  cleanupActivities,
} = require('../controllers/activityController');

router.route('/').get(getAllActivities).post(createActivity);

router.route('/cleanup').delete(cleanupActivities);

module.exports = router;