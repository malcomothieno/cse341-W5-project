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

const Participation = require('../src/models/participationModel');
const Event = require('../src/models/eventModel');
const StudyGroup = require('../src/models/studyGroupModel');
const app = require('../app');
const { USER_ID, OTHER_ID } = require('./helpers');

const TARGET_ID = '885f1c2e8a1b2c3d4e5f6a7d';

beforeEach(() => jest.resetAllMocks());

describe('GET /api/participations', () => {
  it('returns 200 and only the logged-in user\'s records', async () => {
    Participation.findAll.mockResolvedValue([{ _id: 'p1', userId: USER_ID }]);
    const res = await request(app).get('/api/participations');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(Participation.findAll).toHaveBeenCalledWith({ userId: USER_ID });
  });

  it('applies valid targetType and status filters', async () => {
    Participation.findAll.mockResolvedValue([]);
    const res = await request(app).get('/api/participations?targetType=event&status=active');
    expect(res.status).toBe(200);
    expect(Participation.findAll).toHaveBeenCalledWith({ userId: USER_ID, targetType: 'event', status: 'active' });
  });

  it('returns 400 for an invalid targetType', async () => {
    const res = await request(app).get('/api/participations?targetType=party');
    expect(res.status).toBe(400);
  });

  it('returns 500 when the database fails', async () => {
    Participation.findAll.mockRejectedValue(new Error('db down'));
    const res = await request(app).get('/api/participations');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/participations/:id', () => {
  it('returns 200 for the owner', async () => {
    Participation.findById.mockResolvedValue({ _id: 'p1', userId: USER_ID });
    const res = await request(app).get(`/api/participations/${TARGET_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 for another user\'s record', async () => {
    Participation.findById.mockResolvedValue({ _id: 'p1', userId: OTHER_ID });
    const res = await request(app).get(`/api/participations/${TARGET_ID}`);
    expect(res.status).toBe(403);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/participations/12345');
    expect(res.status).toBe(400);
  });

  it('returns 404 when not found', async () => {
    Participation.findById.mockResolvedValue(null);
    const res = await request(app).get(`/api/participations/${TARGET_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 500 when the database fails', async () => {
    Participation.findById.mockRejectedValue(new Error('db down'));
    const res = await request(app).get(`/api/participations/${TARGET_ID}`);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/participations', () => {
  it('returns 201 when joining an existing event', async () => {
    Event.findById.mockResolvedValue({ _id: TARGET_ID });
    Participation.findActiveByUserAndTarget.mockResolvedValue(null);
    Participation.create.mockImplementation(async (d) => ({ _id: 'new', ...d }));
    const res = await request(app).post('/api/participations').send({ targetType: 'event', targetId: TARGET_ID });
    expect(res.status).toBe(201);
    expect(Participation.create.mock.calls[0][0].userId).toBe(USER_ID);
    expect(Participation.create.mock.calls[0][0].status).toBe('active');
  });

  it('returns 201 when joining an existing study group', async () => {
    StudyGroup.findById.mockResolvedValue({ _id: TARGET_ID });
    Participation.findActiveByUserAndTarget.mockResolvedValue(null);
    Participation.create.mockImplementation(async (d) => ({ _id: 'new', ...d }));
    const res = await request(app).post('/api/participations').send({ targetType: 'studyGroup', targetId: TARGET_ID });
    expect(res.status).toBe(201);
  });

  it('returns 400 for missing or invalid fields', async () => {
    const res = await request(app).post('/api/participations').send({ targetType: 'party', targetId: '123' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBe(2);
  });

  it('returns 404 when the target does not exist', async () => {
    Event.findById.mockResolvedValue(null);
    const res = await request(app).post('/api/participations').send({ targetType: 'event', targetId: TARGET_ID });
    expect(res.status).toBe(404);
  });

  it('returns 409 on a duplicate active participation', async () => {
    Event.findById.mockResolvedValue({ _id: TARGET_ID });
    Participation.findActiveByUserAndTarget.mockResolvedValue({ _id: 'existing' });
    const res = await request(app).post('/api/participations').send({ targetType: 'event', targetId: TARGET_ID });
    expect(res.status).toBe(409);
    expect(Participation.create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/participations/:id', () => {
  it('returns 200 when the owner cancels', async () => {
    Participation.findById.mockResolvedValue({ _id: 'p1', userId: USER_ID, status: 'active' });
    Participation.update.mockResolvedValue({ _id: 'p1', status: 'cancelled' });
    const res = await request(app).put(`/api/participations/${TARGET_ID}`).send({ status: 'cancelled' });
    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid status', async () => {
    const res = await request(app).put(`/api/participations/${TARGET_ID}`).send({ status: 'maybe' });
    expect(res.status).toBe(400);
  });

  it('returns 403 for another user\'s record', async () => {
    Participation.findById.mockResolvedValue({ _id: 'p1', userId: OTHER_ID, status: 'active' });
    const res = await request(app).put(`/api/participations/${TARGET_ID}`).send({ status: 'cancelled' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/participations/:id', () => {
  it('returns 200 when the owner deletes', async () => {
    Participation.findById.mockResolvedValue({ _id: 'p1', userId: USER_ID });
    Participation.remove.mockResolvedValue(true);
    const res = await request(app).delete(`/api/participations/${TARGET_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 for another user\'s record', async () => {
    Participation.findById.mockResolvedValue({ _id: 'p1', userId: OTHER_ID });
    const res = await request(app).delete(`/api/participations/${TARGET_ID}`);
    expect(res.status).toBe(403);
  });
});
