const { ObjectId } = require('mongodb');

const EVENT_CATEGORIES = ['academic', 'social', 'sports', 'career', 'workshop', 'other'];
const EVENT_STATUSES = ['scheduled', 'cancelled', 'completed'];
const ANNOUNCEMENT_CATEGORIES = ['general', 'academic', 'safety', 'facilities', 'social'];

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/** True only for a 24-character hex string (rejects numbers, short strings, objects). */
function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id) && ObjectId.isValid(id);
}

/** Parses a value into a Date, or returns null if it is not a valid date. */
function parseDate(value) {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function checkString(errors, body, field, { max, required = true } = {}) {
  const value = body[field];
  if (value === undefined || value === null || value === '') {
    if (required) errors.push(`${field} is required`);
    return;
  }
  if (!isNonEmptyString(value)) {
    errors.push(`${field} must be a non-empty string`);
  } else if (max && value.trim().length > max) {
    errors.push(`${field} must be at most ${max} characters`);
  }
}

/**
 * Validates an event payload (used for both POST and PUT).
 * Returns { errors: string[], data: object } where data contains ONLY allowlisted,
 * type-converted fields (protects against mass-assignment).
 */
function validateEvent(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'], data: null };
  }

  checkString(errors, body, 'title', { max: 120 });
  checkString(errors, body, 'description', { max: 2000 });
  checkString(errors, body, 'location', { max: 200 });

  const startDate = body.startDate === undefined ? null : parseDate(body.startDate);
  const endDate = body.endDate === undefined ? null : parseDate(body.endDate);
  if (body.startDate === undefined) errors.push('startDate is required');
  else if (!startDate) errors.push('startDate must be a valid ISO 8601 date');
  if (body.endDate === undefined) errors.push('endDate is required');
  else if (!endDate) errors.push('endDate must be a valid ISO 8601 date');
  if (startDate && endDate && endDate < startDate) {
    errors.push('endDate must not be earlier than startDate');
  }

  if (body.category === undefined) errors.push('category is required');
  else if (!EVENT_CATEGORIES.includes(body.category)) {
    errors.push(`category must be one of: ${EVENT_CATEGORIES.join(', ')}`);
  }

  if (body.capacity === undefined) errors.push('capacity is required');
  else if (!Number.isInteger(body.capacity) || body.capacity < 1 || body.capacity > 100000) {
    errors.push('capacity must be an integer between 1 and 100000');
  }

  if (body.organizerId === undefined) errors.push('organizerId is required');
  else if (!isValidObjectId(body.organizerId)) {
    errors.push('organizerId must be a valid 24-character ObjectId string');
  }

  const status = body.status === undefined ? 'scheduled' : body.status;
  if (!EVENT_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${EVENT_STATUSES.join(', ')}`);
  }

  if (errors.length) return { errors, data: null };

  return {
    errors: [],
    data: {
      title: body.title.trim(),
      description: body.description.trim(),
      location: body.location.trim(),
      startDate,
      endDate,
      category: body.category,
      capacity: body.capacity,
      organizerId: new ObjectId(body.organizerId),
      status,
    },
  };
}

/**
 * Validates an announcement payload (used for both POST and PUT).
 */
function validateAnnouncement(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'], data: null };
  }

  checkString(errors, body, 'title', { max: 150 });
  checkString(errors, body, 'body', { max: 5000 });

  if (body.category === undefined) errors.push('category is required');
  else if (!ANNOUNCEMENT_CATEGORIES.includes(body.category)) {
    errors.push(`category must be one of: ${ANNOUNCEMENT_CATEGORIES.join(', ')}`);
  }

  if (body.authorId === undefined) errors.push('authorId is required');
  else if (!isValidObjectId(body.authorId)) {
    errors.push('authorId must be a valid 24-character ObjectId string');
  }

  let publishedAt = new Date();
  if (body.publishedAt !== undefined) {
    publishedAt = parseDate(body.publishedAt);
    if (!publishedAt) errors.push('publishedAt must be a valid ISO 8601 date');
  }

  let expiresAt = null;
  if (body.expiresAt !== undefined && body.expiresAt !== null) {
    expiresAt = parseDate(body.expiresAt);
    if (!expiresAt) errors.push('expiresAt must be a valid ISO 8601 date');
    else if (publishedAt && expiresAt < publishedAt) {
      errors.push('expiresAt must not be earlier than publishedAt');
    }
  }

  if (errors.length) return { errors, data: null };

  return {
    errors: [],
    data: {
      title: body.title.trim(),
      body: body.body.trim(),
      category: body.category,
      authorId: new ObjectId(body.authorId),
      publishedAt,
      expiresAt,
    },
  };
}

module.exports = {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  ANNOUNCEMENT_CATEGORIES,
  isValidObjectId,
  validateEvent,
  validateAnnouncement,
};
