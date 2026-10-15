const express = require('express');
const router = express.Router();
const {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramStats,
} = require('../controllers/programController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats/summary', getProgramStats);
router.route('/').get(getPrograms).post(authorize('admin', 'super_admin'), createProgram);
router
  .route('/:id')
  .get(getProgramById)
  .put(authorize('admin', 'super_admin'), updateProgram)
  .delete(authorize('super_admin'), deleteProgram);

module.exports = router;
