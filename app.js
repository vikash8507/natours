const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorControllers');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.use(helmet());

//Setting for template engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Morgan middleware
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
//POST data middleware
app.use(express.json());
app.use(cookieParser());

//Static files middleware
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many accounts created from this IP, please try again after an hour'
});
app.use("/api", limiter);

app.use(mongoSanitize());
app.use(xss());

//Prevent parameter pollution
app.use(hpp({
    whitelist: ['ratingsAverage', 'ratingsQuantity', 'duration', 'maxGroupSize', 'difficulty', 'price']
}));

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//Handle not found url middleware
app.all('*', (req, res, next) => {
    next(new AppError(`Requested url: '${req.originalUrl}' not found`, 404));
});

//Error handler middleware
app.use(globalErrorHandler);

module.exports = app;