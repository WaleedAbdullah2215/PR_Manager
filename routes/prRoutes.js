const express = require('express');
const router = express.Router();
const {
  getAllPRs,
  getPRById,
  createPR,
  updatePR,
  updatePRStep,
  deletePR,
  getPRStats,
} = require('../controllers/prController');

// PR routes
router.route('/').get(getAllPRs).post(createPR);

router.route('/stats').get(getPRStats);

router.route('/:id').get(getPRById).put(updatePR).delete(deletePR);

router.route('/:id/steps/:stepId').put(updatePRStep);

module.exports = router;