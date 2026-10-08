const router = require('express').Router();
const c = require('../controllers/eventsController');

router.get('/', c.getAllEvents);
router.get('/:id', c.getEventById);
router.post('/', c.createEvent);
router.put('/:id', c.updateEvent);
router.delete('/:id', c.deleteEvent);

module.exports = router;
