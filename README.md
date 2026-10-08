# CampusConnect API

REST API for campus events, study groups, announcements and participation (CSE 341 final project, Othieno Malcom).

**Stack:** Node.js, Express, MongoDB Atlas (official driver), Swagger/OpenAPI, Render.

**Week 5 scope:** full CRUD (GET all, GET one, POST, PUT, DELETE) for `events` and `announcements`, input validation, try/catch error handling, and Swagger docs at `/api-docs`. Study groups, participations, users and GitHub OAuth are planned for Weeks 6-7.

## Endpoints

| Resource | Routes |
| --- | --- |
| Events | `GET /api/events` (filters: `category`, `status`), `GET /api/events/:id`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id` |
| Announcements | `GET /api/announcements` (filter: `category`), `GET /api/announcements/:id`, `POST /api/announcements`, `PUT /api/announcements/:id`, `DELETE /api/announcements/:id` |
| Docs | `GET /api-docs` (Swagger UI), `GET /health` |

Status codes: `200` OK, `201` created, `400` invalid id / missing or invalid fields / malformed JSON, `404` not found, `500` database or server failure. Errors look like `{ "error": "Validation failed", "details": ["title is required"] }`.

## Run locally

```bash
npm install
cp .env.example .env      # then fill in MONGODB_URI
npm run seed              # optional: sample events and announcements
npm start                 # http://localhost:3000/api-docs
npm test                  # unit tests (database is mocked)
```

## Deploy to Render

1. Push this repo to GitHub (`.env` and `node_modules` are git-ignored).
2. In MongoDB Atlas > Network Access, allow `0.0.0.0/0` (Render uses changing IPs).
3. Render > New > Web Service > connect the repo. Build command `npm install`, start command `npm start`.
4. Under Environment add `MONGODB_URI` and `DB_NAME` (`campusconnect`). Render sets `PORT` itself.
5. Open `https://<your-app>.onrender.com/api-docs`.

## Structure

```
app.js / server.js        Express setup / startup + DB connection
swagger.json              OpenAPI 3 documentation
src/config/db.js          MongoDB connection
src/routes/               Route definitions
src/controllers/          Request handlers (try/catch, status codes)
src/models/               Collection access functions
src/middleware/           404 + centralised error handler
src/utils/                Validation and error helpers
tests/                    Jest + Supertest tests
scripts/seed.js           Sample data
```

## Notes

- `organizerId` / `authorId` are validated as ObjectIds but not yet checked against a `users` collection (arrives with OAuth in Week 6).
- Write routes are open for now so Swagger can exercise them; authentication and ownership checks are added in Week 6.
