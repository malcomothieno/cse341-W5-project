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

const StudyGroup = require('../src/models/studyGroupModel');
const app = require('../app');
const { USER_ID, OTHER_ID } = require('./helpers');

const validGroup = {
  name: 'Algorithms Study Circle',
  subject: 'Computer Science',
  description: 'Weekly practice.',
  meetingLocation: 'Library 3B',
  meetingSchedule: 'Tuesdays 6-8 PM',
  capacity: 12,
};

beforeEach(() => jest.resetAllMocks());

describe('GET /api/study-groups', () => {
  it('returns 200 and the list', async () => {
    StudyGroup.findAll.mockResolvedValue([{ _id: USER_ID, name: 'Algorithms Study Circle' }]);
    const res = await request(app).get('/api/study-groups');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('passes the subject filter to the model', async () => {
    StudyGroup.findAll.mockResolvedValue([]);
    const res = await request(app).get('/api/study-groups?subject=Mathematics');
    expect(res.status).toBe(200);
    expect(StudyGroup.findAll).toHaveBeenCalledWith({ subject: 'Mathematics' });
  });

  it('returns 400 when subject is an object (operator injection attempt)', async () => {
    const res = await request(app).get('/api/study-groups?subject[$ne]=x');
    expect(res.status).toBe(400);
    expect(StudyGroup.findAll).not.toHaveBeenCalled();
  });

  it('returns 500 when the database fails', async () => {
    StudyGroup.findAll.mockRejectedValue(new Error('db down'));
    const res = await request(app).get('/api/study-groups');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/study-groups/:id', () => {
  it('returns 200 for an existing group', async () => {
    StudyGroup.findById.mockResolvedValue({ _id: USER_ID, name: 'Algorithms Study Circle' });
    const res = await request(app).get(`/api/study-groups/${USER_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Algorithms Study Circle');
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/study-groups/12345');
    expect(res.status).toBe(400);
  });

  it('returns 404 when not found', async () => {
    StudyGroup.findById.mockResolvedValue(null);
    const res = await request(app).get(`/api/study-groups/${USER_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 500 when the database fails', async () => {
    StudyGroup.findById.mockRejectedValue(new Error('db down'));
    const res = await request(app).get(`/api/study-groups/${USER_ID}`);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/study-groups', () => {
  it('returns 201 and makes the logged-in user the owner and first member', async () => {
    StudyGroup.create.mockImplementation(async (d) => ({ _id: 'new', ...d }));
    const res = await request(app).post('/api/study-groups').send(validGroup);
    expect(res.status).toBe(201);
    const saved = StudyGroup.create.mock.calls[0][0];
    expect(saved.ownerId).toBe(USER_ID);
    expect(saved.memberIds).toEqual([USER_ID]);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/study-groups').send({ name: 'Only a name' });
    expect(res.status).toBe(400);
    expect(StudyGroup.create).not.toHaveBeenCalled();
  });

  it('returns 400 when capacity is too small', async () => {
    const res = await request(app).post('/api/study-groups').send({ ...validGroup, capacity: 1 });
    expect(res.status).toBe(400);
  });

  it('returns 500 when the database fails', async () => {
    StudyGroup.create.mockRejectedValue(new Error('db down'));
    const res = await request(app).post('/api/study-groups').send(validGroup);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/study-groups/:id', () => {
  it('returns 200 when the owner updates the group', async () => {
    StudyGroup.findById.mockResolvedValue({ _id: USER_ID, ownerId: USER_ID, memberIds: [USER_ID] });
    StudyGroup.update.mockResolvedValue({ _id: USER_ID, ...validGroup });
    const res = await request(app).put(`/api/study-groups/${USER_ID}`).send(validGroup);
    expect(res.status).toBe(200);
  });

  it('returns 400 when capacity is below the current member count', async () => {
    StudyGroup.findById.mockResolvedValue({ _id: USER_ID, ownerId: USER_ID, memberIds: [1, 2, 3, 4] });
    const res = await request(app).put(`/api/study-groups/${USER_ID}`).send({ ...validGroup, capacity: 3 });
    expect(res.status).toBe(400);
    expect(StudyGroup.update).not.toHaveBeenCalled();
  });

  it('returns 403 for someone else\'s group', async () => {
    StudyGroup.findById.mockResolvedValue({ _id: USER_ID, ownerId: OTHER_ID, memberIds: [] });
    const res = await request(app).put(`/api/study-groups/${USER_ID}`).send(validGroup);
    expect(res.status).toBe(403);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).put('/api/study-groups/abc').send(validGroup);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/study-groups/:id', () => {
  it('returns 200 when the owner deletes the group', async () => {
    StudyGroup.findById.mockResolvedValue({ _id: USER_ID, ownerId: USER_ID });
    StudyGroup.remove.mockResolvedValue(true);
    const res = await request(app).delete(`/api/study-groups/${USER_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 for someone else\'s group', async () => {
    StudyGroup.findById.mockResolvedValue({ _id: USER_ID, ownerId: OTHER_ID });
    const res = await request(app).delete(`/api/study-groups/${USER_ID}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    StudyGroup.findById.mockResolvedValue(null);
    const res = await request(app).delete(`/api/study-groups/${USER_ID}`);
    expect(res.status).toBe(404);
  });
});
