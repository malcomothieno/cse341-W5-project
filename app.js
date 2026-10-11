const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const { passport } = require('./src/config/passport');
const routes = require('./src/routes');
const authRoutes = require('./src/routes/auth');
const { notFound, errorHandler } = require('./src/middleware/errorHandlers');

const isTest = process.env.NODE_ENV === 'test';

if (!process.env.SESSION_SECRET && !isTest) {
  throw new Error('SESSION_SECRET is not set. Add it to your .env file or Render environment variables.');
}

const app = express();

// Render terminates HTTPS at a proxy; this lets secure cookies work behind it.
app.set('trust proxy', 1);

// CORS is only enabled when a separate browser frontend is configured.
if (process.env.FRONTEND_ORIGIN) {
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
}

app.use(express.json({ limit: '100kb' }));

// Sessions are stored in MongoDB so logins survive Render restarts.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'test-only-secret',
    resave: false,
    saveUninitialized: false,
    store:
      isTest || !process.env.MONGODB_URI
        ? undefined
        : MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            dbName: process.env.DB_NAME || 'campusconnect',
            collectionName: 'sessions',
          }),
    cookie: {
      httpOnly: true,
      secure: 'auto', // Secure over HTTPS (Render), plain on http://localhost
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Interactive API documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { customSiteTitle: 'CampusConnect API Docs' })
);

app.get('/', (req, res) => res.redirect('/api-docs'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
