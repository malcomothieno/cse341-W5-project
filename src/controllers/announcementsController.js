const Announcement = require('../models/announcementModel');
const {
  ANNOUNCEMENT_CATEGORIES,
  isValidObjectId,
  validateAnnouncement,
} = require('../utils/validators');
const { isOwnerOrAdmin } = require('../utils/ownership');
const { sendError } = require('../utils/httpError');

const BAD_ID = 'Invalid announcement id format. Expected a 24-character hex ObjectId';

// GET /api/announcements?category=   (public)
async function getAllAnnouncements(req, res) {
  try {
    const filter = {};
    const { category } = req.query;

    if (category !== undefined) {
      if (!ANNOUNCEMENT_CATEGORIES.includes(category)) {
        return sendError(res, 400, `category must be one of: ${ANNOUNCEMENT_CATEGORIES.join(', ')}`);
      }
      filter.category = category;
    }

    const announcements = await Announcement.findAll(filter);
    return res.status(200).json(announcements);
  } catch (err) {
    console.error('getAllAnnouncements failed:', err.message);
    return sendError(res, 500, 'Failed to retrieve announcements');
  }
}

// GET /api/announcements/:id   (public)
async function getAnnouncementById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, BAD_ID);

    const announcement = await Announcement.findById(id);
    if (!announcement) return sendError(res, 404, 'Announcement not found');

    return res.status(200).json(announcement);
  } catch (err) {
    console.error('getAnnouncementById failed:', err.message);
    return sendError(res, 500, 'Failed to retrieve announcement');
  }
}

// POST /api/announcements   (login required)
async function createAnnouncement(req, res) {
  try {
    const { errors, data } = validateAnnouncement(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const created = await Announcement.create({ ...data, authorId: req.user._id });
    return res.status(201).json(created);
  } catch (err) {
    console.error('createAnnouncement failed:', err.message);
    return sendError(res, 500, 'Failed to create announcement');
  }
}

// PUT /api/announcements/:id   (login required, author or admin)
async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, BAD_ID);

    const { errors, data } = validateAnnouncement(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const existing = await Announcement.findById(id);
    if (!existing) return sendError(res, 404, 'Announcement not found');
    if (!isOwnerOrAdmin(req.user, existing.authorId)) {
      return sendError(res, 403, 'You can only modify announcements you authored');
    }

    const updated = await Announcement.update(id, data);
    if (!updated) return sendError(res, 404, 'Announcement not found');

    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateAnnouncement failed:', err.message);
    return sendError(res, 500, 'Failed to update announcement');
  }
}

// DELETE /api/announcements/:id   (login required, author or admin)
async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, BAD_ID);

    const existing = await Announcement.findById(id);
    if (!existing) return sendError(res, 404, 'Announcement not found');
    if (!isOwnerOrAdmin(req.user, existing.authorId)) {
      return sendError(res, 403, 'You can only modify announcements you authored');
    }

    const deleted = await Announcement.remove(id);
    if (!deleted) return sendError(res, 404, 'Announcement not found');

    return res.status(200).json({ message: 'Announcement deleted successfully', id });
  } catch (err) {
    console.error('deleteAnnouncement failed:', err.message);
    return sendError(res, 500, 'Failed to delete announcement');
  }
}

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
