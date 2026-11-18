const express = require('express');
const router = express.Router();
const {
  getTrainees,
  getTraineeById,
  createTrainee,
  updateTrainee,
  deleteTrainee,
  getTraineeDemographics,
  registerTrainee,
  lookupTrainee,
  approveTrainee,
  rejectTrainee,
  getTraineeFilterOptions,
} = require('../controllers/traineeController');
const { protect, authorize } = require('../middleware/auth');

// Public endpoints
router.post('/register', registerTrainee);
router.get('/lookup', lookupTrainee);

// Protected endpoints
router.use(protect);

router.get('/filter-options', getTraineeFilterOptions);
router.get('/stats/demographics', getTraineeDemographics);
router.put('/:id/approve', authorize('super_admin'), approveTrainee);
router.put('/:id/reject', authorize('super_admin'), rejectTrainee);

router
  .route('/')
  .get(getTrainees)
  .post(authorize('super_admin'), createTrainee);

router
  .route('/:id')
  .get(getTraineeById)
  .put(authorize('super_admin'), updateTrainee)
  .delete(authorize('super_admin'), deleteTrainee);

module.exports = router;
