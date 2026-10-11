const router = require('express').Router();
const c = require('../controllers/participationsController');
const { requireAuth } = require('../middleware/auth');

// Participation records are personal, so every route requires login.
router.use(requireAuth);

router.get('/', c.getAllParticipations);
router.get('/:id', c.getParticipationById);
router.post('/', c.createParticipation);
router.put('/:id', c.updateParticipation);
router.delete('/:id', c.deleteParticipation);

module.exports = router;
