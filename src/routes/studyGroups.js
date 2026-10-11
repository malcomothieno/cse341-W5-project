const router = require('express').Router();
const c = require('../controllers/studyGroupsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', c.getAllStudyGroups);
router.get('/:id', c.getStudyGroupById);
router.post('/', requireAuth, c.createStudyGroup);
router.put('/:id', requireAuth, c.updateStudyGroup);
router.delete('/:id', requireAuth, c.deleteStudyGroup);

module.exports = router;
