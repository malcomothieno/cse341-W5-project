const router = require('express').Router();

router.use('/events', require('./events'));
router.use('/announcements', require('./announcements'));
router.use('/study-groups', require('./studyGroups'));
router.use('/participations', require('./participations'));

module.exports = router;
