const express = require('express');

const tourControllers = require('./../controllers/tourControllers');
const authController = require('./../controllers/authControllers');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

//Check route parameters
// router.param('id', tourControllers.checkID);

router.use('/:tourId/reviews', reviewRouter);

//TOP 5 CHEAPEST TOURS
router
  .route('/top-5-cheap-tour')
  .get(tourControllers.topTours, tourControllers.getAllTours);

//Tour root routes
router
  .route('/')
  .get(tourControllers.getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourControllers.createTour);

//Get all tours from a specific location in a specific radius
router
  .route('/tours-within/:distance/center/:latlan/unit/:unit')
  .get(tourControllers.getToursWithin);

//Get all tours distance from a specific location
router
  .route('/distances/:latlan/unit/:unit')
  .get(tourControllers.getDistances);

//Specific tour routes
router
  .route('/:id')
  .get(tourControllers.getTour)
  .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourControllers.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourControllers.deleteTour);

module.exports = router;