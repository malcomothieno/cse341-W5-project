const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const routes = require('./src/routes');
const { notFound, errorHandler } = require('./src/middleware/errorHandlers');

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Interactive API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'CampusConnect API Docs',
}));

app.get('/', (req, res) => res.redirect('/api-docs'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
