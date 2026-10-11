const router = require('express').Router();
const c = require('../controllers/announcementsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', c.getAllAnnouncements);
router.get('/:id', c.getAnnouncementById);
router.post('/', requireAuth, c.createAnnouncement);
router.put('/:id', requireAuth, c.updateAnnouncement);
router.delete('/:id', requireAuth, c.deleteAnnouncement);

module.exports = router;
