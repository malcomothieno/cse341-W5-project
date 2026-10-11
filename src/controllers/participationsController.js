const Participation = require('../models/participationModel');
const Event = require('../models/eventModel');
const StudyGroup = require('../models/studyGroupModel');
const {
  PARTICIPATION_TARGETS,
  PARTICIPATION_STATUSES,
  isValidObjectId,
  validateParticipation,
  validateParticipationUpdate,
} = require('../utils/validators');
const { isOwnerOrAdmin } = require('../utils/ownership');
const { sendError } = require('../utils/httpError');

const BAD_ID = 'Invalid participation id format. Expected a 24-character hex ObjectId';

// GET /api/participations?targetType=&status=   (login required; own records, admins see all)
async function getAllParticipations(req, res) {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const { targetType, status } = req.query;

    if (targetType !== undefined) {
      if (!PARTICIPATION_TARGETS.includes(targetType)) {
        return sendError(res, 400, `targetType must be one of: ${PARTICIPATION_TARGETS.join(', ')}`);
      }
      filter.targetType = targetType;
    }
    if (status !== undefined) {
      if (!PARTICIPATION_STATUSES.includes(status)) {
        return sendError(res, 400, `status must be one of: ${PARTICIPATION_STATUSES.join(', ')}`);
      }
      filter.status = status;
    }

    const items = await Participation.findAll(filter);
    return res.status(200).json(items);
  } catch (err) {
    console.error('getAllParticipations failed:', err.message);
    return sendError(res, 500, 'Failed to retrieve participations');
  }
}

// GET /api/participations/:id   (login required, owner or admin)
async function getParticipationById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, BAD_ID);

    const item = await Participation.findById(id);
    if (!item) return sendError(res, 404, 'Participation not found');
    if (!isOwnerOrAdmin(req.user, item.userId)) {
      return sendError(res, 403, 'You can only view your own participation records');
    }

    return res.status(200).json(item);
  } catch (err) {
    console.error('getParticipationById failed:', err.message);
    return sendError(res, 500, 'Failed to retrieve participation');
  }
}

// POST /api/participations   (login required) - join an event or study group
async function createParticipation(req, res) {
  try {
    const { errors, data } = validateParticipation(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    // Validate the reference before writing
    const targetModel = data.targetType === 'event' ? Event : StudyGroup;
    const target = await targetModel.findById(String(data.targetId));
    if (!target) {
      const label = data.targetType === 'event' ? 'Event' : 'Study group';
      return sendError(res, 404, `${label} not found for the given targetId`);
    }

    const duplicate = await Participation.findActiveByUserAndTarget(
      req.user._id,
      data.targetType,
      data.targetId
    );
    if (duplicate) {
      return sendError(res, 409, 'You already have an active participation for this target');
    }

    const created = await Participation.create({
      userId: req.user._id,
      targetType: data.targetType,
      targetId: data.targetId,
      status: 'active',
      joinedAt: new Date(),
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error('createParticipation failed:', err.message);
    return sendError(res, 500, 'Failed to create participation');
  }
}

// PUT /api/participations/:id   (login required, owner or admin) - change status
async function updateParticipation(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, BAD_ID);

    const { errors, data } = validateParticipationUpdate(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const existing = await Participation.findById(id);
    if (!existing) return sendError(res, 404, 'Participation not found');
    if (!isOwnerOrAdmin(req.user, existing.userId)) {
      return sendError(res, 403, 'You can only modify your own participation records');
    }

    if (data.status === 'active' && existing.status !== 'active') {
      const duplicate = await Participation.findActiveByUserAndTarget(
        existing.userId,
        existing.targetType,
        existing.targetId
      );
      if (duplicate) {
        return sendError(res, 409, 'An active participation already exists for this target');
      }
    }

    const updated = await Participation.update(id, data);
    if (!updated) return sendError(res, 404, 'Participation not found');

    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateParticipation failed:', err.message);
    return sendError(res, 500, 'Failed to update participation');
  }
}

// DELETE /api/participations/:id   (login required, owner or admin) - leave
async function deleteParticipation(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, BAD_ID);

    const existing = await Participation.findById(id);
    if (!existing) return sendError(res, 404, 'Participation not found');
    if (!isOwnerOrAdmin(req.user, existing.userId)) {
      return sendError(res, 403, 'You can only modify your own participation records');
    }

    const deleted = await Participation.remove(id);
    if (!deleted) return sendError(res, 404, 'Participation not found');

    return res.status(200).json({ message: 'Participation deleted successfully', id });
  } catch (err) {
    console.error('deleteParticipation failed:', err.message);
    return sendError(res, 500, 'Failed to delete participation');
  }
}

module.exports = {
  getAllParticipations,
  getParticipationById,
  createParticipation,
  updateParticipation,
  deleteParticipation,
};
