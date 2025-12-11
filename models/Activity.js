const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    prId: {
      type: String,
      ref: 'PR',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
activitySchema.index({ timestamp: -1 });
activitySchema.index({ prId: 1 });

module.exports = mongoose.model('Activity', activitySchema);