const Announcement = require('../models/announcementModel');
const {
  ANNOUNCEMENT_CATEGORIES,
  isValidObjectId,
  validateAnnouncement,
} = require('../utils/validators');
const { sendError } = require('../utils/httpError');

// GET /api/announcements?category=
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

// GET /api/announcements/:id
async function getAnnouncementById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid announcement id format. Expected a 24-character hex ObjectId');
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) return sendError(res, 404, 'Announcement not found');

    return res.status(200).json(announcement);
  } catch (err) {
    console.error('getAnnouncementById failed:', err.message);
    return sendError(res, 500, 'Failed to retrieve announcement');
  }
}

// POST /api/announcements
async function createAnnouncement(req, res) {
  try {
    const { errors, data } = validateAnnouncement(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const created = await Announcement.create(data);
    return res.status(201).json(created);
  } catch (err) {
    console.error('createAnnouncement failed:', err.message);
    return sendError(res, 500, 'Failed to create announcement');
  }
}

// PUT /api/announcements/:id
async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid announcement id format. Expected a 24-character hex ObjectId');
    }

    const { errors, data } = validateAnnouncement(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const updated = await Announcement.update(id, data);
    if (!updated) return sendError(res, 404, 'Announcement not found');

    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateAnnouncement failed:', err.message);
    return sendError(res, 500, 'Failed to update announcement');
  }
}

// DELETE /api/announcements/:id
async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid announcement id format. Expected a 24-character hex ObjectId');
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
