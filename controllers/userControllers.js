const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

//Body filter fields function
const filterFields = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if(fields.includes(el)) newObj[el] = obj[el];
  })
  return newObj;
}

//Update me controller
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Check for password or confirm password in body
  if(req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route does not handle password update. Please use /updatePassword.", 400));
  }

  // 2) Filter required or unwanted body fields
  const filterBody = filterFields(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

//Delete me controller
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findOneAndUpdate(req.user._id, {ative: false});

  res.status(204).json({
    status: 'success',
    data: null
  });
});

//Get all user route handler
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()
  res.status(500).json({
    status: 'success',
    total: users.length,
    data: {
      users
    }
  });
});

//Create a user route handler
exports.createUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: "This route not defined yet."
  });
}

//Get a specific user route handler
exports.getUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: "This route not defined yet."
  });
}

//Get data of loged in user
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-passwordChangedAt -passwordResetToken -passwordResetTokenExp -__v');
  if(!user) {
    return next(new AppError('You are not logged in.', 401));
  }

  res.status(200).send({
    status: 'success',
    data: {
      user
    }
  });
});

//Update user route handler
exports.updateUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: "This route not defined yet."
  });
}

//Delete user route handler
exports.deleteUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: "This route not defined yet."
  });
}