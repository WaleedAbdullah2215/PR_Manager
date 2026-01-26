const PR = require('../models/Procurement');
const Activity = require('../models/Activity');

const getInitialSteps = () => [
  { id: 1, name: 'Request Prepared', description: 'Draft PR details', completed: true, completedAt: new Date() },
  { id: 2, name: 'HOD Approval', description: 'Department head approval', completed: true, completedAt: new Date() },
  { id: 3, name: 'Purchase Approval', description: 'Purchase department review', completed: true, completedAt: new Date() },
  { id: 4, name: 'RFQ Generated', description: 'Request for Quotation created', completed: false, completedAt: null },
  { id: 5, name: 'Supplier Extracted', description: 'Supplier list prepared', completed: false, completedAt: null },
  { id: 6, name: 'RFQs Sent', description: 'RFQs sent to suppliers', completed: false, completedAt: null },
  { id: 7, name: 'Quotations Received', description: 'Supplier quotations collected', completed: false, completedAt: null },
  { id: 8, name: 'Quotations Analysis', description: 'Analyze and compare quotations', completed: false, completedAt: null },
  { id: 9, name: 'Comparison Approved', description: 'Comparison approved by HOD', completed: false, completedAt: null },
  { id: 10, name: 'Approved to Order', description: 'Order approved by higher authorities', completed: false, completedAt: null },
  { id: 11, name: 'PO Created', description: 'Purchase Order issued', completed: false, completedAt: null },
  { id: 12, name: 'Delivery Received', description: 'Items received from supplier', completed: false, completedAt: null },
  { id: 13, name: 'GRN Created', description: 'Goods Receipt Note created', completed: false, completedAt: null },
];

// Migration function to update old PRs to new step structure
const migrateSteps = (oldSteps) => {
  const newSteps = getInitialSteps();
  
  // If already has 13 steps, just return as is
  if (oldSteps.length === 13) {
    return oldSteps;
  }
  
  // Map old steps to new structure
  const migratedSteps = newSteps.map((newStep, index) => {
    const oldStep = oldSteps[index];
    
    if (oldStep) {
      return {
        ...newStep,
        completed: oldStep.completed || false,
        completedAt: oldStep.completedAt || null,
        comment: oldStep.comment || ''
      };
    }
    
    return newStep;
  });
  
  return migratedSteps;
};

exports.getAllPRs = async (req, res) => {
  try {
    const { status, priority, category, search, sortBy = 'createdAt', order = 'desc' } = req.query;

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

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const prs = await PR.find(query).sort(sortOptions);

    // Migrate old PRs to new step structure
    const migratedPRs = prs.map(pr => {
      const prObj = pr.toObject();
      prObj.steps = migrateSteps(prObj.steps);
      return prObj;
    });

    res.status(200).json({
      success: true,
      count: migratedPRs.length,
      data: migratedPRs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching PRs',
      error: error.message,
    });
  }
};

exports.getPRById = async (req, res) => {
  try {
    const pr = await PR.findOne({ id: req.params.id });

    if (!pr) {
      return res.status(404).json({
        success: false,
        message: `PR with ID ${req.params.id} not found`,
      });
    }

    // Migrate steps if needed
    const prObj = pr.toObject();
    prObj.steps = migrateSteps(prObj.steps);

    res.status(200).json({
      success: true,
      data: prObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching PR',
      error: error.message,
    });
  }
};

exports.createPR = async (req, res) => {
  try {
    const { id, title, description, rfqNumber, priority, category, dueDate } = req.body;

    const existingPR = await PR.findOne({ id });
    if (existingPR) {
      return res.status(400).json({
        success: false,
        message: `PR with ID ${id} already exists`,
      });
    }

    const pr = await PR.create({
      id,
      title,
      description,
      rfqNumber: rfqNumber || '',
      priority: priority || 'medium',
      category: category || 'Others',
      assignee: process.env.DEFAULT_USER || 'Mohammad Amir Khan',
      dueDate: dueDate || null,
      steps: getInitialSteps(),
      status: 'in-progress',
    });

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


exports.updatePR = async (req, res) => {
  try {
    const { title, description, rfqNumber, priority, category, dueDate, status } = req.body;

    const pr = await PR.findOne({ id: req.params.id });

    if (!pr) {
      return res.status(404).json({
        success: false,
        message: `PR with ID ${req.params.id} not found`,
      });
    }

    if (title) pr.title = title;
    if (description !== undefined) pr.description = description;
    if (rfqNumber !== undefined) pr.rfqNumber = rfqNumber;
    if (priority) pr.priority = priority;
    if (category) pr.category = category;
    if (dueDate !== undefined) pr.dueDate = dueDate;
    if (status) pr.status = status;

    await pr.save();

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

    //check fro preeviosus steps if completed or not
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

    const wasCompleted = pr.steps[stepIndex].completed;
    
    pr.steps[stepIndex].completed = completed !== undefined ? completed : pr.steps[stepIndex].completed;
    pr.steps[stepIndex].comment = comment !== undefined ? comment : pr.steps[stepIndex].comment;
    pr.steps[stepIndex].completedAt = completed ? new Date() : null;

    // Update PR status based on PO Created completion
    const poCreatedStep = pr.steps.find(s => s.name === 'PO Created');
    const allCompleted = pr.steps.every(s => s.completed);
    
    if (allCompleted || (poCreatedStep && poCreatedStep.completed)) {
      pr.status = 'completed';
    } else {
      pr.status = 'in-progress';
    }

    await pr.save();

    if (completed !== undefined && completed !== wasCompleted) {
      const action = completed ? 'Completed Step' : 'Reopened Step';
      const stepName = pr.steps[stepIndex].name;
      
      await Activity.create({
        action,
        details: `PR ${id}: ${stepName}${comment ? ` - ${comment}` : ''}`,
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

exports.deletePR = async (req, res) => {
  try {
    const pr = await PR.findOneAndDelete({ id: req.params.id });

    if (!pr) {
      return res.status(404).json({
        success: false,
        message: `PR with ID ${req.params.id} not found`,
      });
    }

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