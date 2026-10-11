# CampusConnect API

REST API for campus events, study groups, announcements and participation, with GitHub OAuth (CSE 341 final project, Othieno Malcom).

**Stack:** Node.js, Express, MongoDB Atlas (official driver), Passport.js (GitHub OAuth), express-session + connect-mongo, Swagger/OpenAPI, Jest + Supertest, Render.

## Collections

| Collection | Purpose | Written by |
| --- | --- | --- |
| `events` | Campus events (title, description, location, startDate, endDate, category, capacity, organizerId, status) | API (`/api/events`) |
| `announcements` | Campus notices | API (`/api/announcements`) |
| `studyGroups` | Subject groups with schedule, capacity, members | API (`/api/study-groups`) |
| `participations` | A user joining an event or study group | API (`/api/participations`) |
| `users` | GitHub-linked profiles and role | OAuth login (automatic) |
| `sessions` | Login sessions | connect-mongo (automatic) |

## Access rules

- `GET` on events, announcements and study groups is **public**.
- `POST`, `PUT`, `DELETE` on those three require **login** (401 otherwise); `PUT`/`DELETE` also require that you **own** the record (403 otherwise). Users with `role: "admin"` can modify any record (set the role by hand in Atlas).
- **All** participation routes require login and only show/modify your own records.
- The owner (`organizerId`, `authorId`, `ownerId`, `userId`) always comes from the logged-in session, never from the request body.

Status codes: `200` OK, `201` created, `400` invalid id / validation failure / malformed JSON, `401` not logged in, `403` not your record, `404` not found, `409` duplicate participation, `500` database or server failure. Errors look like `{ "error": "Validation failed", "details": ["title is required"] }`.

## Auth routes

`GET /auth/github` (start login, open in a browser tab) - `GET /auth/github/callback` - `GET /auth/status` - `POST /auth/logout`

## Setup

```bash
npm install
cp .env.example .env     # fill in MONGODB_URI, SESSION_SECRET and the GitHub values
npm run seed             # optional sample data
npm start                # http://localhost:3000/api-docs
npm test                 # all tests (database is mocked)
```

### GitHub OAuth apps

Create **two** apps at GitHub > Settings > Developer settings > OAuth Apps:

| | Homepage URL | Authorization callback URL |
| --- | --- | --- |
| Local | `http://localhost:3000` | `http://localhost:3000/auth/github/callback` |
| Render | `https://<your-app>.onrender.com` | `https://<your-app>.onrender.com/auth/github/callback` |

Put each app's Client ID/Secret in the matching environment (local `.env`, Render dashboard) and set `GITHUB_CALLBACK_URL` to that app's callback URL.

### Deploy to Render

1. Push to GitHub (`.env` and `node_modules` are git-ignored).
2. Atlas > Network Access: allow `0.0.0.0/0`.
3. Render > New Web Service > connect the repo. Build `npm install`, start `npm start`.
4. Environment variables: `MONGODB_URI`, `DB_NAME`, `SESSION_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`.
5. Open `https://<your-app>.onrender.com/api-docs`, then `/auth/github` in a new tab to log in.

## Structure

```
app.js / server.js          Express + session + passport setup / startup
swagger.json                OpenAPI 3 documentation
src/config/                 db.js (MongoDB), passport.js (GitHub strategy)
src/routes/                 events, announcements, studyGroups, participations, auth
src/controllers/            Handlers (try/catch, validation, ownership, status codes)
src/models/                 Collection access (baseModel + one file per collection)
src/middleware/             requireAuth, 404 + error handler
src/utils/                  validators, ownership, error helper
tests/                      Jest + Supertest (GET, auth, validation, ownership)
scripts/seed.js             Sample data
```

## Notes

- `studyGroups.memberIds` starts with the owner. Joining a group through `/api/participations` records the participation but does not yet update `memberIds` (planned stretch work, along with capacity enforcement and a waitlist).
- Seeded records are owned by a placeholder id, so editing them returns 403. Create your own records to demo PUT and DELETE.
