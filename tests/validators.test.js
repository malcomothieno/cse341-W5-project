const {
  validateEvent,
  validateAnnouncement,
  validateStudyGroup,
  validateParticipation,
  validateParticipationUpdate,
  isValidObjectId,
} = require('../src/utils/validators');

describe('isValidObjectId', () => {
  it('accepts a 24-char hex string', () => expect(isValidObjectId('665f1c2e8a1b2c3d4e5f6a7b')).toBe(true));
  it.each(['12345', '', 'zzzzzzzzzzzzzzzzzzzzzzzz', 123, null, undefined, {}])('rejects %p', (v) =>
    expect(isValidObjectId(v)).toBe(false));
});

describe('validateEvent', () => {
  const ok = { title: 'T', description: 'D', location: 'L', startDate: '2026-11-12T09:00:00Z', endDate: '2026-11-12T10:00:00Z', category: 'social', capacity: 10 };
  it('accepts a valid event and defaults status', () => {
    const { errors, data } = validateEvent(ok);
    expect(errors).toEqual([]);
    expect(data.status).toBe('scheduled');
  });
  it('drops unknown fields (mass-assignment protection)', () => {
    const { data } = validateEvent({ ...ok, role: 'admin', organizerId: 'x' });
    expect(data.role).toBeUndefined();
    expect(data.organizerId).toBeUndefined();
  });
  it('rejects non-integer capacity, bad category and bad status', () => {
    expect(validateEvent({ ...ok, capacity: 1.5 }).errors.length).toBe(1);
    expect(validateEvent({ ...ok, category: 'x' }).errors.length).toBe(1);
    expect(validateEvent({ ...ok, status: 'x' }).errors.length).toBe(1);
  });
  it('rejects a non-object body', () => {
    expect(validateEvent(undefined).errors.length).toBe(1);
    expect(validateEvent([]).errors.length).toBe(1);
  });
});

describe('validateAnnouncement', () => {
  const ok = { title: 'T', body: 'B', category: 'general' };
  it('accepts a valid announcement with defaults', () => {
    const { errors, data } = validateAnnouncement(ok);
    expect(errors).toEqual([]);
    expect(data.expiresAt).toBeNull();
    expect(data.publishedAt).toBeInstanceOf(Date);
  });
  it('rejects bad dates and category', () => {
    expect(validateAnnouncement({ ...ok, publishedAt: 'nope' }).errors.length).toBe(1);
    expect(validateAnnouncement({ ...ok, category: 'x' }).errors.length).toBe(1);
  });
});

describe('validateStudyGroup', () => {
  const ok = { name: 'N', subject: 'S', description: 'D', meetingLocation: 'L', meetingSchedule: 'M', capacity: 5 };
  it('accepts a valid group', () => expect(validateStudyGroup(ok).errors).toEqual([]));
  it('rejects capacity outside 2-100', () => {
    expect(validateStudyGroup({ ...ok, capacity: 1 }).errors.length).toBe(1);
    expect(validateStudyGroup({ ...ok, capacity: 101 }).errors.length).toBe(1);
  });
  it('reports every missing field', () => expect(validateStudyGroup({}).errors.length).toBe(6));
});

describe('validateParticipation', () => {
  it('accepts a valid body', () =>
    expect(validateParticipation({ targetType: 'event', targetId: '665f1c2e8a1b2c3d4e5f6a7b' }).errors).toEqual([]));
  it('rejects bad targetType and targetId', () =>
    expect(validateParticipation({ targetType: 'x', targetId: '1' }).errors.length).toBe(2));
  it('validates status updates', () => {
    expect(validateParticipationUpdate({ status: 'cancelled' }).errors).toEqual([]);
    expect(validateParticipationUpdate({ status: 'nope' }).errors.length).toBe(1);
    expect(validateParticipationUpdate({}).errors.length).toBe(1);
  });
});
