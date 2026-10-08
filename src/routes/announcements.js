const router = require('express').Router();
const c = require('../controllers/announcementsController');

router.get('/', c.getAllAnnouncements);
router.get('/:id', c.getAnnouncementById);
router.post('/', c.createAnnouncement);
router.put('/:id', c.updateAnnouncement);
router.delete('/:id', c.deleteAnnouncement);

module.exports = router;
