const request = require('supertest');

jest.mock('../src/models/eventModel');
jest.mock('../src/models/announcementModel');

const Announcement = require('../src/models/announcementModel');
const app = require('../app');

const VALID_ID = '665f1c2e8a1b2c3d4e5f6a7b';
const validAnnouncement = {
  title: 'Library extended hours',
  body: 'Open until 2 AM during finals.',
  category: 'academic',
  authorId: VALID_ID,
};

beforeEach(() => jest.resetAllMocks());

describe('GET /api/announcements', () => {
  it('returns 200 and the list', async () => {
    Announcement.findAll.mockResolvedValue([{ _id: VALID_ID, title: 'Library extended hours' }]);
    const res = await request(app).get('/api/announcements');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 400 for an invalid category filter', async () => {
    const res = await request(app).get('/api/announcements?category=bogus');
    expect(res.status).toBe(400);
  });

  it('returns 500 when the database fails', async () => {
    Announcement.findAll.mockRejectedValue(new Error('db down'));
    const res = await request(app).get('/api/announcements');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/announcements/:id', () => {
  it('returns 200 for an existing announcement', async () => {
    Announcement.findById.mockResolvedValue({ _id: VALID_ID, ...validAnnouncement });
    const res = await request(app).get(`/api/announcements/${VALID_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/announcements/12345');
    expect(res.status).toBe(400);
  });

  it('returns 404 when not found', async () => {
    Announcement.findById.mockResolvedValue(null);
    const res = await request(app).get(`/api/announcements/${VALID_ID}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/announcements', () => {
  it('returns 201 for a valid announcement', async () => {
    Announcement.create.mockResolvedValue({ _id: VALID_ID, ...validAnnouncement });
    const res = await request(app).post('/api/announcements').send(validAnnouncement);
    expect(res.status).toBe(201);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/announcements').send({ title: 'No body' });
    expect(res.status).toBe(400);
    expect(Announcement.create).not.toHaveBeenCalled();
  });

  it('returns 500 when the database fails', async () => {
    Announcement.create.mockRejectedValue(new Error('db down'));
    const res = await request(app).post('/api/announcements').send(validAnnouncement);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/announcements/:id', () => {
  it('returns 200 when updated', async () => {
    Announcement.update.mockResolvedValue({ _id: VALID_ID, ...validAnnouncement });
    const res = await request(app).put(`/api/announcements/${VALID_ID}`).send(validAnnouncement);
    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).put('/api/announcements/xyz').send(validAnnouncement);
    expect(res.status).toBe(400);
  });

  it('returns 404 when not found', async () => {
    Announcement.update.mockResolvedValue(null);
    const res = await request(app).put(`/api/announcements/${VALID_ID}`).send(validAnnouncement);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/announcements/:id', () => {
  it('returns 200 when deleted', async () => {
    Announcement.remove.mockResolvedValue(true);
    const res = await request(app).delete(`/api/announcements/${VALID_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 when nothing was deleted', async () => {
    Announcement.remove.mockResolvedValue(false);
    const res = await request(app).delete(`/api/announcements/${VALID_ID}`);
    expect(res.status).toBe(404);
  });
});
