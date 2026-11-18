const express = require('express');
const router = express.Router();
const {
  getBatchesByProgram,
  createBatch,
  updateBatch,
  deleteBatch,
  assignParticipantToBatch,
  removeParticipantFromBatch,
} = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/program/:programId', getBatchesByProgram);
router.post('/', authorize('admin', 'super_admin'), createBatch);
router.put('/:id', authorize('admin', 'super_admin'), updateBatch);
router.delete('/:id', authorize('admin', 'super_admin'), deleteBatch);
router.post('/:id/assign', authorize('admin', 'super_admin'), assignParticipantToBatch);
router.post('/:id/remove-participant', authorize('admin', 'super_admin'), removeParticipantFromBatch);

module.exports = router;
