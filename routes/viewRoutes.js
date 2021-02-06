const express = require('express');
const viewController = require('./../controllers/viewControllers');

const router = express.Router();

router.get('/', viewController.getAllTours);
router.get('/tour/:slug', viewController.getTour);
router.get('/login', viewController.login);

module.exports = router;