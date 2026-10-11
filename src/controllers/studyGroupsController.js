const StudyGroup = require('../models/studyGroupModel');
const { isValidObjectId, validateStudyGroup } = require('../utils/validators');
const { isOwnerOrAdmin } = require('../utils/ownership');
const { sendError } = require('../utils/httpError');

const BAD_ID = 'Invalid study group id format. Expected a 24-character hex ObjectId';

// GET /api/study-groups?subject=   (public)
async function getAllStudyGroups(req, res) {
  try {
    const filter = {};
    const { subject } = req.query;

    if (subject !== undefined) {
      if (typeof subject !== 'string' || subject.trim() === '' || subject.length > 100) {
        return sendError(res, 400, 'subject must be a non-empty string of at most 100 characters');
      }
      filter.subject = subject.trim();
    }

    const groups = await StudyGroup.findAll(filter);
    return res.status(200).json(groups);
  } catch (err) {
    console.error('getAllStudyGroups failed:', err.message);
    return sendError(res, 500, 'Failed to retrieve study groups');
  }
}

// GET /api/study-groups/:id   (public)
async function getStudyGroupById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, BAD_ID);

    const group = await StudyGroup.findById(id);
    if (!group) return sendError(res, 404, 'Study group not found');

    return res.status(200).json(group);
  } catch (err) {
    console.error('getStudyGroupById failed:', err.message);
    return sendError(res, 500, 'Failed to retrieve study group');
  }
}

// POST /api/study-groups   (login required)
async function createStudyGroup(req, res) {
  try {
    const { errors, data } = validateStudyGroup(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const created = await StudyGroup.create({
      ...data,
      ownerId: req.user._id,
      memberIds: [req.user._id],
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error('createStudyGroup failed:', err.message);
    return sendError(res, 500, 'Failed to create study group');
  }
}

// PUT /api/study-groups/:id   (login required, owner or admin)
async function updateStudyGroup(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, BAD_ID);

    const { errors, data } = validateStudyGroup(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const existing = await StudyGroup.findById(id);
    if (!existing) return sendError(res, 404, 'Study group not found');
    if (!isOwnerOrAdmin(req.user, existing.ownerId)) {
      return sendError(res, 403, 'You can only modify study groups you own');
    }

    const memberCount = Array.isArray(existing.memberIds) ? existing.memberIds.length : 0;
    if (data.capacity < memberCount) {
      return sendError(res, 400, 'Validation failed', [
        `capacity cannot be lower than the current member count (${memberCount})`,
      ]);
    }

    const updated = await StudyGroup.update(id, data);
    if (!updated) return sendError(res, 404, 'Study group not found');

    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateStudyGroup failed:', err.message);
    return sendError(res, 500, 'Failed to update study group');
  }
}

// DELETE /api/study-groups/:id   (login required, owner or admin)
async function deleteStudyGroup(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, BAD_ID);

    const existing = await StudyGroup.findById(id);
    if (!existing) return sendError(res, 404, 'Study group not found');
    if (!isOwnerOrAdmin(req.user, existing.ownerId)) {
      return sendError(res, 403, 'You can only modify study groups you own');
    }

    const deleted = await StudyGroup.remove(id);
    if (!deleted) return sendError(res, 404, 'Study group not found');

    return res.status(200).json({ message: 'Study group deleted successfully', id });
  } catch (err) {
    console.error('deleteStudyGroup failed:', err.message);
    return sendError(res, 500, 'Failed to delete study group');
  }
}

module.exports = {
  getAllStudyGroups,
  getStudyGroupById,
  createStudyGroup,
  updateStudyGroup,
  deleteStudyGroup,
};
