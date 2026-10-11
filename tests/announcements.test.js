const request = require('supertest');

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

const Announcement = require('../src/models/announcementModel');
const app = require('../app');
const { USER_ID, OTHER_ID } = require('./helpers');

const validAnnouncement = {
  title: 'Library extended hours',
  body: 'Open until 2 AM during finals.',
  category: 'academic',
};

beforeEach(() => jest.resetAllMocks());

describe('GET /api/announcements', () => {
  it('returns 200 and the list', async () => {
    Announcement.findAll.mockResolvedValue([{ _id: USER_ID, title: 'Library extended hours' }]);
    const res = await request(app).get('/api/announcements');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('passes a valid category filter to the model', async () => {
    Announcement.findAll.mockResolvedValue([]);
    const res = await request(app).get('/api/announcements?category=safety');
    expect(res.status).toBe(200);
    expect(Announcement.findAll).toHaveBeenCalledWith({ category: 'safety' });
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
    Announcement.findById.mockResolvedValue({ _id: USER_ID, ...validAnnouncement });
    const res = await request(app).get(`/api/announcements/${USER_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/announcements/12345');
    expect(res.status).toBe(400);
  });

  it('returns 404 when not found', async () => {
    Announcement.findById.mockResolvedValue(null);
    const res = await request(app).get(`/api/announcements/${USER_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 500 when the database fails', async () => {
    Announcement.findById.mockRejectedValue(new Error('db down'));
    const res = await request(app).get(`/api/announcements/${USER_ID}`);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/announcements', () => {
  it('returns 201 and sets authorId from the logged-in user', async () => {
    Announcement.create.mockImplementation(async (d) => ({ _id: 'new', ...d }));
    const res = await request(app).post('/api/announcements').send({ ...validAnnouncement, authorId: OTHER_ID });
    expect(res.status).toBe(201);
    expect(Announcement.create.mock.calls[0][0].authorId).toBe(USER_ID);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/announcements').send({ title: 'No body' });
    expect(res.status).toBe(400);
    expect(Announcement.create).not.toHaveBeenCalled();
  });

  it('returns 400 when expiresAt is before publishedAt', async () => {
    const res = await request(app).post('/api/announcements').send({
      ...validAnnouncement, publishedAt: '2026-12-01T00:00:00Z', expiresAt: '2026-11-01T00:00:00Z',
    });
    expect(res.status).toBe(400);
  });

  it('returns 500 when the database fails', async () => {
    Announcement.create.mockRejectedValue(new Error('db down'));
    const res = await request(app).post('/api/announcements').send(validAnnouncement);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/announcements/:id', () => {
  it('returns 200 when the author updates their announcement', async () => {
    Announcement.findById.mockResolvedValue({ _id: USER_ID, authorId: USER_ID });
    Announcement.update.mockResolvedValue({ _id: USER_ID, ...validAnnouncement });
    const res = await request(app).put(`/api/announcements/${USER_ID}`).send(validAnnouncement);
    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).put('/api/announcements/xyz').send(validAnnouncement);
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid body', async () => {
    const res = await request(app).put(`/api/announcements/${USER_ID}`).send({ title: 'x' });
    expect(res.status).toBe(400);
  });

  it('returns 403 for someone else\'s announcement', async () => {
    Announcement.findById.mockResolvedValue({ _id: USER_ID, authorId: OTHER_ID });
    const res = await request(app).put(`/api/announcements/${USER_ID}`).send(validAnnouncement);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    Announcement.findById.mockResolvedValue(null);
    const res = await request(app).put(`/api/announcements/${USER_ID}`).send(validAnnouncement);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/announcements/:id', () => {
  it('returns 200 when the author deletes it', async () => {
    Announcement.findById.mockResolvedValue({ _id: USER_ID, authorId: USER_ID });
    Announcement.remove.mockResolvedValue(true);
    const res = await request(app).delete(`/api/announcements/${USER_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 for someone else\'s announcement', async () => {
    Announcement.findById.mockResolvedValue({ _id: USER_ID, authorId: OTHER_ID });
    const res = await request(app).delete(`/api/announcements/${USER_ID}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    Announcement.findById.mockResolvedValue(null);
    const res = await request(app).delete(`/api/announcements/${USER_ID}`);
    expect(res.status).toBe(404);
  });
});
