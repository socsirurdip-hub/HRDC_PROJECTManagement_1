const express = require('express');
const router = express.Router();
const {
  getTrainees,
  getTraineeById,
  createTrainee,
  updateTrainee,
  deleteTrainee,
  getTraineeDemographics,
} = require('../controllers/traineeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats/demographics', getTraineeDemographics);
router.route('/').get(getTrainees).post(createTrainee);
router
  .route('/:id')
  .get(getTraineeById)
  .put(updateTrainee)
  .delete(authorize('admin', 'super_admin'), deleteTrainee);

module.exports = router;
