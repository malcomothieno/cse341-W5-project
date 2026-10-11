const request = require('supertest');

// Logged-in user for protected routes (auth itself is tested in auth.test.js)
jest.mock('../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { _id: '665f1c2e8a1b2c3d4e5f6a7b', role: 'user' };
    next();
  },
}));
jest.mock('../src/models/eventModel');
jest.mock('../src/models/participationModel');
jest.mock('../src/models/studyGroupModel');
jest.mock('../src/models/announcementModel');
jest.mock('../src/models/userModel');

const Event = require('../src/models/eventModel');
const app = require('../app');
const { USER_ID, OTHER_ID } = require('./helpers');

const validEvent = {
  title: 'Spring Career Fair',
  description: 'Meet employers.',
  location: 'Student Center',
  startDate: '2026-11-12T09:00:00.000Z',
  endDate: '2026-11-12T15:00:00.000Z',
  category: 'career',
  capacity: 300,
};

beforeEach(() => jest.resetAllMocks());

describe('GET /api/events', () => {
  it('returns 200 and the list of events', async () => {
    Event.findAll.mockResolvedValue([{ _id: USER_ID, title: 'Spring Career Fair' }]);
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('passes a valid category filter to the model', async () => {
    Event.findAll.mockResolvedValue([]);
    const res = await request(app).get('/api/events?category=career&status=scheduled');
    expect(res.status).toBe(200);
    expect(Event.findAll).toHaveBeenCalledWith({ category: 'career', status: 'scheduled' });
  });

  it('returns 400 for an invalid category filter', async () => {
    const res = await request(app).get('/api/events?category=nonsense');
    expect(res.status).toBe(400);
  });

  it('returns 500 when the database fails', async () => {
    Event.findAll.mockRejectedValue(new Error('db down'));
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/db down/);
  });
});

describe('GET /api/events/:id', () => {
  it('returns 200 for an existing event', async () => {
    Event.findById.mockResolvedValue({ _id: USER_ID, title: 'Spring Career Fair' });
    const res = await request(app).get(`/api/events/${USER_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Spring Career Fair');
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/events/12345');
    expect(res.status).toBe(400);
    expect(Event.findById).not.toHaveBeenCalled();
  });

  it('returns 404 when the event does not exist', async () => {
    Event.findById.mockResolvedValue(null);
    const res = await request(app).get(`/api/events/${USER_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 500 when the database fails', async () => {
    Event.findById.mockRejectedValue(new Error('db down'));
    const res = await request(app).get(`/api/events/${USER_ID}`);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/events', () => {
  it('returns 201 and sets organizerId from the logged-in user', async () => {
    Event.create.mockImplementation(async (d) => ({ _id: 'new', ...d }));
    const res = await request(app).post('/api/events').send({ ...validEvent, organizerId: OTHER_ID });
    expect(res.status).toBe(201);
    expect(Event.create.mock.calls[0][0].organizerId).toBe(USER_ID); // body value ignored
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/events').send({ title: 'Only a title' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(1);
    expect(Event.create).not.toHaveBeenCalled();
  });

  it('returns 400 when endDate is before startDate', async () => {
    const res = await request(app).post('/api/events').send({ ...validEvent, endDate: '2026-11-11T00:00:00.000Z' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app).post('/api/events').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
  });

  it('returns 500 when the database fails', async () => {
    Event.create.mockRejectedValue(new Error('db down'));
    const res = await request(app).post('/api/events').send(validEvent);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/events/:id', () => {
  it('returns 200 when the organizer updates their event', async () => {
    Event.findById.mockResolvedValue({ _id: USER_ID, organizerId: USER_ID });
    Event.update.mockResolvedValue({ _id: USER_ID, ...validEvent });
    const res = await request(app).put(`/api/events/${USER_ID}`).send(validEvent);
    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).put('/api/events/abc').send(validEvent);
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid body', async () => {
    const res = await request(app).put(`/api/events/${USER_ID}`).send({ ...validEvent, capacity: -5 });
    expect(res.status).toBe(400);
  });

  it('returns 403 when the event belongs to someone else', async () => {
    Event.findById.mockResolvedValue({ _id: USER_ID, organizerId: OTHER_ID });
    const res = await request(app).put(`/api/events/${USER_ID}`).send(validEvent);
    expect(res.status).toBe(403);
    expect(Event.update).not.toHaveBeenCalled();
  });

  it('returns 404 when the event does not exist', async () => {
    Event.findById.mockResolvedValue(null);
    const res = await request(app).put(`/api/events/${USER_ID}`).send(validEvent);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/events/:id', () => {
  it('returns 200 when the organizer deletes their event', async () => {
    Event.findById.mockResolvedValue({ _id: USER_ID, organizerId: USER_ID });
    Event.remove.mockResolvedValue(true);
    const res = await request(app).delete(`/api/events/${USER_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).delete('/api/events/12345');
    expect(res.status).toBe(400);
  });

  it('returns 403 when the event belongs to someone else', async () => {
    Event.findById.mockResolvedValue({ _id: USER_ID, organizerId: OTHER_ID });
    const res = await request(app).delete(`/api/events/${USER_ID}`);
    expect(res.status).toBe(403);
    expect(Event.remove).not.toHaveBeenCalled();
  });

  it('returns 404 when the event does not exist', async () => {
    Event.findById.mockResolvedValue(null);
    const res = await request(app).delete(`/api/events/${USER_ID}`);
    expect(res.status).toBe(404);
  });
});
