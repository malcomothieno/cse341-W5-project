const Event = require('../models/eventModel');
const {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  isValidObjectId,
  validateEvent,
} = require('../utils/validators');
const { sendError } = require('../utils/httpError');

// GET /api/events?category=&status=
async function getAllEvents(req, res) {
  try {
    const filter = {};
    const { category, status } = req.query;

    if (category !== undefined) {
      if (!EVENT_CATEGORIES.includes(category)) {
        return sendError(res, 400, `category must be one of: ${EVENT_CATEGORIES.join(', ')}`);
      }
      filter.category = category;
    }
    if (status !== undefined) {
      if (!EVENT_STATUSES.includes(status)) {
        return sendError(res, 400, `status must be one of: ${EVENT_STATUSES.join(', ')}`);
      }
      filter.status = status;
    }

    const events = await Event.findAll(filter);
    return res.status(200).json(events);
  } catch (err) {
    console.error('getAllEvents failed:', err.message);
    return sendError(res, 500, 'Failed to retrieve events');
  }
}

// GET /api/events/:id
async function getEventById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid event id format. Expected a 24-character hex ObjectId');
    }

    const event = await Event.findById(id);
    if (!event) return sendError(res, 404, 'Event not found');

    return res.status(200).json(event);
  } catch (err) {
    console.error('getEventById failed:', err.message);
    return sendError(res, 500, 'Failed to retrieve event');
  }
}

// POST /api/events
async function createEvent(req, res) {
  try {
    const { errors, data } = validateEvent(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const created = await Event.create(data);
    return res.status(201).json(created);
  } catch (err) {
    console.error('createEvent failed:', err.message);
    return sendError(res, 500, 'Failed to create event');
  }
}

// PUT /api/events/:id
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid event id format. Expected a 24-character hex ObjectId');
    }

    const { errors, data } = validateEvent(req.body);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const updated = await Event.update(id, data);
    if (!updated) return sendError(res, 404, 'Event not found');

    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateEvent failed:', err.message);
    return sendError(res, 500, 'Failed to update event');
  }
}

// DELETE /api/events/:id
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid event id format. Expected a 24-character hex ObjectId');
    }

    const deleted = await Event.remove(id);
    if (!deleted) return sendError(res, 404, 'Event not found');

    return res.status(200).json({ message: 'Event deleted successfully', id });
  } catch (err) {
    console.error('deleteEvent failed:', err.message);
    return sendError(res, 500, 'Failed to delete event');
  }
}

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent };
