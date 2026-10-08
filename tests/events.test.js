const request = require('supertest');

jest.mock('../src/models/eventModel');
jest.mock('../src/models/announcementModel');

const Event = require('../src/models/eventModel');
const app = require('../app');

const VALID_ID = '665f1c2e8a1b2c3d4e5f6a7b';
const validEvent = {
  title: 'Spring Career Fair',
  description: 'Meet employers.',
  location: 'Student Center',
  startDate: '2026-11-12T09:00:00.000Z',
  endDate: '2026-11-12T15:00:00.000Z',
  category: 'career',
  capacity: 300,
  organizerId: VALID_ID,
};

beforeEach(() => jest.resetAllMocks());

describe('GET /api/events', () => {
  it('returns 200 and the list of events', async () => {
    Event.findAll.mockResolvedValue([{ _id: VALID_ID, title: 'Spring Career Fair' }]);
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
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
    Event.findById.mockResolvedValue({ _id: VALID_ID, title: 'Spring Career Fair' });
    const res = await request(app).get(`/api/events/${VALID_ID}`);
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
    const res = await request(app).get(`/api/events/${VALID_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 500 when the database fails', async () => {
    Event.findById.mockRejectedValue(new Error('db down'));
    const res = await request(app).get(`/api/events/${VALID_ID}`);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/events', () => {
  it('returns 201 for a valid event', async () => {
    Event.create.mockResolvedValue({ _id: VALID_ID, ...validEvent });
    const res = await request(app).post('/api/events').send(validEvent);
    expect(res.status).toBe(201);
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
  it('returns 200 when updated', async () => {
    Event.update.mockResolvedValue({ _id: VALID_ID, ...validEvent });
    const res = await request(app).put(`/api/events/${VALID_ID}`).send(validEvent);
    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).put('/api/events/abc').send(validEvent);
    expect(res.status).toBe(400);
  });

  it('returns 404 when the event does not exist', async () => {
    Event.update.mockResolvedValue(null);
    const res = await request(app).put(`/api/events/${VALID_ID}`).send(validEvent);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/events/:id', () => {
  it('returns 200 when deleted', async () => {
    Event.remove.mockResolvedValue(true);
    const res = await request(app).delete(`/api/events/${VALID_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).delete('/api/events/12345');
    expect(res.status).toBe(400);
  });

  it('returns 404 when nothing was deleted', async () => {
    Event.remove.mockResolvedValue(false);
    const res = await request(app).delete(`/api/events/${VALID_ID}`);
    expect(res.status).toBe(404);
  });
});
