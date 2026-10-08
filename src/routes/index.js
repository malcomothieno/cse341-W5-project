const router = require('express').Router();

router.use('/events', require('./events'));
router.use('/announcements', require('./announcements'));
// Week 6+: study-groups, participations, users routes are added here.

module.exports = router;
