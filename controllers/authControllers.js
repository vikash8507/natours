const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const AppError = require('./../utils/AppError');
const sendMail = require('./../utils/email');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

const jwtTokenGenerate = id => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
}

const sendJWT = (res, status, user) => {
    const token = jwtTokenGenerate(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    };
    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;
    res.status(status).json({
        status: 'success',
        token,
        data: {
            user: user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);
    sendJWT(res, 201, newUser);
})

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return next(new AppError('Please provide email and password both', 400));
    }

    const user = await User.findOne({email}).select('+password');

    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Please provide correct email and password', 401));
    }
    const token = jwtTokenGenerate(user._id);
    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
})

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    //Checking token axist or not and retrive it
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if(req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    
    if(!token) {
        return next(new Error('You are not logged in. Please login to access.', 401));
    }
    //Token Varification
    const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    //Checking user still exist or not
    const currentUser = await User.findById(decodedToken.id);
    if(!currentUser) {
        return next(new AppError("The user belonging to this token does no longer exist.", 401));
    }

    //Checking reset password after token generation
    if(currentUser.changedPasswordAt(decodedToken.iat)) {
        return next(new AppError("You are currently changed your password. Please login again.", 401));
    }

    //GRANT ACCESS TO PROTECTED ROUTE FOR AUTHORIZED USER_EXIST
    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
          return next(new AppError("You do not have permission to do this action", 403));  
        }

        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Find user by provided email address
    const user = await User.findOne({email: req.body.email});
    if(!user) {
        return next(new AppError("No user found with this email.", 404));
    }

    // 2) Generate a randon reset password token
    const resetToken = user.generateResetPasswordToken();
    // console.log(resetToken);
    await user.save({validateBeforeSave: false});

    // 3) Send this token to user's email address
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/${resetToken}`;
    const message = `Reset your password using this link: ${resetURL}`;
    try{
        await sendMail({
            email: user.email,
            message,
            subject: 'Reset your password(Valid for 10 minutes)'
        });
        res.status(200).json({
            status: 'success',
            message: 'Link send to email successfuly'
        });
    } catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExp = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('Something wrong happened in sending email.', 500));
    }    
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Find user using requested token
    resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: resetToken, passwordResetTokenExp: {$gt: Date.now()}});

    // 2) If token is not expire and user exist then reset password
    if(!user) {
        return next(new AppError('Token is invalid or has expire.', 400));
    }

    user.password = req.body.password,
    user.passwordConfirm = req.body.passwordConfirm,
    user.passwordResetToken = undefined;
    user.passwordResetTokenExp = undefined;
    await user.save();

    // 3) Update changedPasswordAt property of that user
    // 4) Log to in user and send JWTToken
    const token = jwtTokenGenerate(user._id);
    res.status(200).json({
        status: 'status',
        token
    });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Find user
    const user = await User.findById(req.user.id).select('+password');

    // 2) Varify requested password and user password
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Please enter correct password', 401));
    }

    // 3) Update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.save();

    // 4) Log to in user and send JWTtoken
    const token = jwtTokenGenerate(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
});