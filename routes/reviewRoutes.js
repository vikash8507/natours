const express = require('express');
const reviewControllers = require('../controllers/reviewControllers');
const authControllers = require('../controllers/authControllers');

const router = express.Router({mergeParams: true});

//Protect all routes only for logged in users
router.use(authControllers.protect);

router
    .route('/')
    .get(reviewControllers.getAllReviews)
    .post(authControllers.restrictTo('user'), reviewControllers.createReview);

module.exports = router;