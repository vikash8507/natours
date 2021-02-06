const AppError = require('./../utils/appError');

const handleCastError = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handleDuplicateValue = err => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please enter anothor value.`;
    return new AppError(message, 400);
}

const handleValidationError = err => {
    const ers = Object.values(err.errors).map(el => el.message);
    const message = `Invalide data entry: ${ers.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = err => new AppError('Invalid Token. Please Login again', 401);

// const productionErrorDandler = (err, res) => {
//     //Operational Error
//     if(error.isOperational) {
//         res.status(error.statusCode).json({
//             status: error.status,
//             message: error.message
//         });

//     //Programming Error
//     } else {
//         res.status(500).json({
//             status: error.status,
//             message: "Something went very wrong!"
//         });
//     }
// }

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // if (process.env.NODE_ENV === 'development') {
    
    if(err.name === 'CastError') err = handleCastError(err);

    if(err.code === 11000) err = handleDuplicateValue(err);

    if(err.name === 'ValidationError') err = handleValidationError(err);

    if(err.name === 'JsonWebTokenError') err = handleJWTError(err);

    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message
    });

    // } else if(process.env.NODE_ENV === 'production'){
    //     productionErrorDandler(error, res)
    // }
}