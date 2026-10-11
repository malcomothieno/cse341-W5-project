const router = require('express').Router();
const c = require('../controllers/eventsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', c.getAllEvents);
router.get('/:id', c.getEventById);
router.post('/', requireAuth, c.createEvent);
router.put('/:id', requireAuth, c.updateEvent);
router.delete('/:id', requireAuth, c.deleteEvent);

module.exports = router;
