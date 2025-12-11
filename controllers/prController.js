const PR = require('../models/Procurement');
const Activity = require('../models/Activity');

// Get initial steps template
const getInitialSteps = () => [
  { id: 1, name: 'Request Prepared', description: 'Draft PR details', completed: false, completedAt: null },
  { id: 2, name: 'HOD Approval', description: 'Department head approval', completed: false, completedAt: null },
  { id: 3, name: 'Purchase Approval', description: 'Purchase department review', completed: false, completedAt: null },
  { id: 4, name: 'RFQ Generated', description: 'Request for Quotation created', completed: false, completedAt: null },
  { id: 5, name: 'Supplier Extracted', description: 'Supplier list prepared', completed: false, completedAt: null },
  { id: 6, name: 'RFQs Sent', description: 'RFQs sent to suppliers', completed: false, completedAt: null },
  { id: 7, name: 'Quotations Received', description: 'Supplier quotations collected', completed: false, completedAt: null },
  { id: 8, name: 'Comparison Report', description: 'Quotation comparison prepared', completed: false, completedAt: null },
  { id: 9, name: 'Comparison Approved', description: 'Comparison approved by HOD', completed: false, completedAt: null },
  { id: 10, name: 'PO Created', description: 'Purchase Order issued', completed: false, completedAt: null },
  { id: 11, name: 'Delivery Received', description: 'Items received from supplier', completed: false, completedAt: null },
  { id: 12, name: 'Delivery Verified', description: 'Delivery verified & GRN created', completed: false, completedAt: null },
];

// @desc    Get all PRs
// @route   GET /api/prs
// @access  Public
exports.getAllPRs = async (req, res) => {
  try {
    const { status, priority, category, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build query
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { id: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const prs = await PR.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: prs.length,
      data: prs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching PRs',
      error: error.message,
    });
  }
};

// @desc    Get single PR by ID
// @route   GET /api/prs/:id
// @access  Public
exports.getPRById = async (req, res) => {
  try {
    const pr = await PR.findOne({ id: req.params.id });

    if (!pr) {
      return res.status(404).json({
        success: false,
        message: `PR with ID ${req.params.id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: pr,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching PR',
      error: error.message,
    });
  }
};

// @desc    Create new PR
// @route   POST /api/prs
// @access  Public
exports.createPR = async (req, res) => {
  try {
    const { id, title, description, priority, category, dueDate } = req.body;

    // Check if PR with same ID exists
    const existingPR = await PR.findOne({ id });
    if (existingPR) {
      return res.status(400).json({
        success: false,
        message: `PR with ID ${id} already exists`,
      });
    }

    // Create PR with initial steps
    const pr = await PR.create({
      id,
      title,
      description,
      priority: priority || 'medium',
      category: category || 'Office',
      assignee: 'Mohammad Amir Khan',
      dueDate: dueDate || null,
      steps: getInitialSteps(),
      status: 'in-progress',
    });

    // Log activity
    await Activity.create({
      action: 'Created PR',
      details: `PR ${id}: ${title}`,
      prId: id,
    });

    res.status(201).json({
      success: true,
      message: 'PR created successfully',
      data: pr,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating PR',
      error: error.message,
    });
  }
};

// @desc    Update PR
// @route   PUT /api/prs/:id
// @access  Public
exports.updatePR = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, status } = req.body;

    const pr = await PR.findOne({ id: req.params.id });

    if (!pr) {
      return res.status(404).json({
        success: false,
        message: `PR with ID ${req.params.id} not found`,
      });
    }

    // Update fields
    if (title) pr.title = title;
    if (description !== undefined) pr.description = description;
    if (priority) pr.priority = priority;
    if (category) pr.category = category;
    if (dueDate !== undefined) pr.dueDate = dueDate;
    if (status) pr.status = status;

    await pr.save();

    // Log activity
    await Activity.create({
      action: 'Updated PR',
      details: `PR ${req.params.id}: ${title || 'details updated'}`,
      prId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: 'PR updated successfully',
      data: pr,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating PR',
      error: error.message,
    });
  }
};

// @desc    Update PR step
// @route   PUT /api/prs/:id/steps/:stepId
// @access  Public
exports.updatePRStep = async (req, res) => {
  try {
    const { completed, comment } = req.body;
    const { id, stepId } = req.params;

    const pr = await PR.findOne({ id });

    if (!pr) {
      return res.status(404).json({
        success: false,
        message: `PR with ID ${id} not found`,
      });
    }

    const stepIndex = pr.steps.findIndex(s => s.id === parseInt(stepId));

    if (stepIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Step with ID ${stepId} not found`,
      });
    }

    // Check if previous steps are completed
    if (completed && stepIndex > 0) {
      const prevSteps = pr.steps.slice(0, stepIndex);
      const allPrevCompleted = prevSteps.every(s => s.completed);

      if (!allPrevCompleted) {
        return res.status(400).json({
          success: false,
          message: 'Complete previous steps first',
        });
      }
    }

    // Update step
    pr.steps[stepIndex].completed = completed !== undefined ? completed : pr.steps[stepIndex].completed;
    pr.steps[stepIndex].comment = comment !== undefined ? comment : pr.steps[stepIndex].comment;
    pr.steps[stepIndex].completedAt = completed ? new Date() : null;

    // Check if all steps are completed
    const allCompleted = pr.steps.every(s => s.completed);
    if (allCompleted) {
      pr.status = 'completed';
    } else {
      pr.status = 'in-progress';
    }

    await pr.save();

    // Log activity if step was completed
    if (completed && completed !== pr.steps[stepIndex].completed) {
      await Activity.create({
        action: 'Completed Step',
        details: `PR ${id}: ${pr.steps[stepIndex].name}`,
        prId: id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Step updated successfully',
      data: pr,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating step',
      error: error.message,
    });
  }
};

// @desc    Delete PR
// @route   DELETE /api/prs/:id
// @access  Public
exports.deletePR = async (req, res) => {
  try {
    const pr = await PR.findOneAndDelete({ id: req.params.id });

    if (!pr) {
      return res.status(404).json({
        success: false,
        message: `PR with ID ${req.params.id} not found`,
      });
    }

    // Log activity
    await Activity.create({
      action: 'Deleted PR',
      details: `PR ${req.params.id} was removed`,
      prId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: 'PR deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting PR',
      error: error.message,
    });
  }
};

// @desc    Get PR statistics
// @route   GET /api/prs/stats
// @access  Public
exports.getPRStats = async (req, res) => {
  try {
    const totalPRs = await PR.countDocuments();
    const inProgress = await PR.countDocuments({ status: 'in-progress' });
    const completed = await PR.countDocuments({ status: 'completed' });
    
    const byPriority = await PR.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const byCategory = await PR.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalPRs,
        inProgress,
        completed,
        byPriority,
        byCategory,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};