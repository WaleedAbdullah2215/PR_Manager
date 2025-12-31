const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  comment: {
    type: String,
    default: '',
  },
});

const prSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['FM/Maintenance', 'Remote Areas', 'Marketing', 'Leasing', 'HR', 'IT', 'Finance', 'Consultancy', 'Others'],
      default: 'Others',
    },
    assignee: {
      type: String,
      default: 'Mohammad Amir Khan',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    steps: [stepSchema],
  },
  {
    timestamps: true,
  }
);

prSchema.index({ id: 1 });
prSchema.index({ status: 1 });
prSchema.index({ priority: 1 });
prSchema.index({ category: 1 });
prSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PR', prSchema);