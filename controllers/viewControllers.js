const Tour = require('./../models/tourModel');
const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAllTours = catchAsync(async (req, res) => {
    const tours = await Tour.find();

    res.status(200).render('overview', {
        title: "All Tours",
        tours
    });
});

exports.getTour = catchAsync(async (req, res) => {
    const tour = await Tour.findOne({slug: req.params.slug});
    const reviews = await Review.findOne({tour: tour._id});

    res.status(200).render('tour', {
        title: tour.name,
        tour,
        reviews
    })
});

exports.login = catchAsync(async (req, res) => {
    res.status(200).render('login', {
        title: 'Log in to your account'
    });
});