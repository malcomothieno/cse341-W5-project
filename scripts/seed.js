// Inserts sample records so the database is not empty when you demo it.
// Usage: npm run seed   (requires MONGODB_URI in .env). Safe to run more than once.
require('dotenv').config();
const { ObjectId } = require('mongodb');
const { connectDb, closeDb } = require('../src/config/db');

// Placeholder owner for sample data. Records owned by this id belong to nobody who can log in,
// so editing them returns 403 - create your own records through Swagger to demo PUT/DELETE.
const SAMPLE_USER_ID = new ObjectId('665f1c2e8a1b2c3d4e5f6a7b');

async function seed() {
  const db = await connectDb();
  const now = new Date();

  const events = [
    { title: 'Welcome Week Mixer', description: 'Meet fellow students, clubs and staff.', location: 'Student Center Lawn', startDate: new Date('2026-11-02T17:00:00Z'), endDate: new Date('2026-11-02T20:00:00Z'), category: 'social', capacity: 400, organizerId: SAMPLE_USER_ID, status: 'scheduled' },
    { title: 'Resume Workshop', description: 'Hands-on session to polish your resume.', location: 'Career Services, Room 204', startDate: new Date('2026-11-05T14:00:00Z'), endDate: new Date('2026-11-05T16:00:00Z'), category: 'workshop', capacity: 40, organizerId: SAMPLE_USER_ID, status: 'scheduled' },
    { title: 'Intramural Soccer Finals', description: 'Championship match for the fall league.', location: 'North Field', startDate: new Date('2026-11-09T18:00:00Z'), endDate: new Date('2026-11-09T20:00:00Z'), category: 'sports', capacity: 250, organizerId: SAMPLE_USER_ID, status: 'scheduled' },
  ];

  const announcements = [
    { title: 'Library extended hours during finals', body: 'The main library stays open until 2 AM from Dec 1 to Dec 14.', category: 'academic', authorId: SAMPLE_USER_ID, publishedAt: now, expiresAt: new Date('2026-12-15T00:00:00Z') },
    { title: 'Parking lot B closed for repairs', body: 'Lot B is closed Nov 3-7. Please use Lot C.', category: 'facilities', authorId: SAMPLE_USER_ID, publishedAt: now, expiresAt: null },
    { title: 'Campus safety walk-home service', body: 'Request a free evening escort via the campus safety desk.', category: 'safety', authorId: SAMPLE_USER_ID, publishedAt: now, expiresAt: null },
  ];

  const studyGroups = [
    { name: 'Algorithms Study Circle', subject: 'Computer Science', description: 'Weekly practice on data structures and algorithms.', meetingLocation: 'Library, Room 3B', meetingSchedule: 'Tuesdays 6-8 PM', capacity: 12, ownerId: SAMPLE_USER_ID, memberIds: [SAMPLE_USER_ID] },
    { name: 'Calculus Crash Group', subject: 'Mathematics', description: 'Problem-solving sessions before each midterm.', meetingLocation: 'Science Hall 110', meetingSchedule: 'Thursdays 4-6 PM', capacity: 8, ownerId: SAMPLE_USER_ID, memberIds: [SAMPLE_USER_ID] },
  ];

  for (const e of events) {
    await db.collection('events').updateOne(
      { title: e.title },
      { $setOnInsert: { ...e, createdAt: now, updatedAt: now } },
      { upsert: true }
    );
  }
  for (const a of announcements) {
    await db.collection('announcements').updateOne(
      { title: a.title },
      { $setOnInsert: { ...a, createdAt: now, updatedAt: now } },
      { upsert: true }
    );
  }

  for (const g of studyGroups) {
    await db.collection('studyGroups').updateOne(
      { name: g.name },
      { $setOnInsert: { ...g, createdAt: now, updatedAt: now } },
      { upsert: true }
    );
  }

  console.log(`Seeded up to ${events.length} events, ${announcements.length} announcements and ${studyGroups.length} study groups.`);
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(closeDb);
