const express = require('express')

const userControllers = require('./../controllers/userControllers');
const authControllers = require('./../controllers/authControllers');

const router = express.Router();

//Signup route
router.post('/signup', authControllers.signup);
//Login route
router.post('/login', authControllers.login);
//FORGOT PASSWORD ROUTE
router.post('/forgotPassword', authControllers.forgotPassword);
//Password reset route
router.patch('/resetPassword/:token', authControllers.resetPassword);

//Protect all routes after that
router.use(authControllers.protect);

//Update password route
router.patch('/updatePassword', authControllers.updatePassword);
//Update me route
router.patch('/updateMe', userControllers.updateMe);
//Delete me route
router.delete('/deleteMe', userControllers.deleteMe);
//Get me route
router.get('/me', userControllers.getMe);

//Restrict all routes after that only for admin
router.use(authControllers.restrictTo('admin'))

//User root routes
router
  .route('/')
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser)

//Specific user routes
router
  .route('/:id')
  .get(userControllers.getUser)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser);

module.exports = router;