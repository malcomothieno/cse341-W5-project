const request = require('supertest');

jest.mock('../src/models/eventModel');
jest.mock('../src/models/participationModel');
jest.mock('../src/models/studyGroupModel');
jest.mock('../src/models/announcementModel');
jest.mock('../src/models/userModel');

const Event = require('../src/models/eventModel');
const app = require('../app');
const { USER_ID } = require('./helpers');

beforeEach(() => jest.resetAllMocks());

describe('Protected routes reject anonymous callers with 401', () => {
  const protectedCalls = [
    ['post', '/api/events'],
    ['put', `/api/events/${USER_ID}`],
    ['delete', `/api/events/${USER_ID}`],
    ['post', '/api/announcements'],
    ['put', `/api/announcements/${USER_ID}`],
    ['delete', `/api/announcements/${USER_ID}`],
    ['post', '/api/study-groups'],
    ['put', `/api/study-groups/${USER_ID}`],
    ['delete', `/api/study-groups/${USER_ID}`],
    ['get', '/api/participations'],
    ['get', `/api/participations/${USER_ID}`],
    ['post', '/api/participations'],
    ['put', `/api/participations/${USER_ID}`],
    ['delete', `/api/participations/${USER_ID}`],
  ];

  it.each(protectedCalls)('%s %s -> 401', async (method, url) => {
    const res = await request(app)[method](url).send({});
    expect(res.status).toBe(401);
  });

  it('does not touch the database when unauthenticated', async () => {
    await request(app).post('/api/events').send({ title: 'x' });
    expect(Event.create).not.toHaveBeenCalled();
  });
});

describe('Public routes stay open', () => {
  it.each(['/api/events', '/api/announcements', '/api/study-groups'])('GET %s is not 401', async (url) => {
    // models are auto-mocked and return undefined -> controller may 500, but never 401
    const res = await request(app).get(url);
    expect(res.status).not.toBe(401);
  });
});

describe('/auth routes', () => {
  it('GET /auth/status reports not authenticated', async () => {
    const res = await request(app).get('/auth/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ authenticated: false });
  });

  it('GET /auth/failure returns 401', async () => {
    const res = await request(app).get('/auth/failure');
    expect(res.status).toBe(401);
  });

  it('GET /auth/github returns 503 when OAuth is not configured', async () => {
    const res = await request(app).get('/auth/github');
    expect(res.status).toBe(503);
  });

  it('POST /auth/logout succeeds even without a session', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(200);
  });
});

describe('Misc', () => {
  it('unknown routes return 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
