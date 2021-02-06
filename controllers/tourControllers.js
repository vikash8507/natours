const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

//GET TOP 5 CHEAP TOURS
exports.topTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlan, unit } = req.params;
  const [lat, lan] = latlan.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if(!lat || !lan) {
    return next(new AppError('Please provide latitude and longitude', 400));
  }

  const tours = await Tour.find({ 
    startLocation: { $geoWithin: { $centerSphere: [[lan, lat], radius] } } 
  });

  console.log(distance, lat, lan, unit);
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { distance, latlan, unit } = req.params;
  const [lat, lan] = latlan.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001

  if(!lat || !lan) {
    return next(new AppError('Please provide latitude and longitude', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lan * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  console.log(distance, lat, lan, unit);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});

//Get all tours handler
exports.getAllTours = catchAsync(async (req, res, next) => {

    //FIND QUERY
    //FILTERING QUERY
    const queryObj = {...req.query};
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(f => delete queryObj[f]);

    //ADVANCED QUERY FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    //FINDING TOURS
    let query = Tour.find(JSON.parse(queryStr));

    //SORTING TOURS
    if(req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    //Fields selecting
    if(req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    //PAGINATION
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const countTours = await Tour.countDocuments();
      if (skip >= countTours) throw new Error("Page out of range");
    };

    //EXECUT QUERY
    const tours = await query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    });
});

//Create a new tour handler
exports.createTour = catchAsync(async (req, res, next) => {

  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: newTour
  });

});

//Get a specific tour handler
exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id).populate('reviews');

    if(!tour) {
      return next(new AppError('No tour found with that ID', 404));
    }
    console.log(tour);
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
});

//Update tour handler
exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if(!tour) {
      return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
});

//Delete tour handler
exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    
    if(!tour) {
      return next(new AppError('No tour found with that ID', 404));
    }

    res.status(204).json({
    status: 'success',
    data: null
  });
});