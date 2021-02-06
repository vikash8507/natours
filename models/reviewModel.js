const mongoose = require('mongoose');
const Tour = require('./tourModel');

reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty']
    },
    rating: {
        type: Number,
        min: [1, 'Rating should be grater than 0'],
        max: [5, 'Rating should be less than 5'],
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour.']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to an user.']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
}, 
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

//Static method for calculating average rating
reviewSchema.static.calcAverageRating = async function(tourId) {
    const stats = await this.agregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].nRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0
        });
    }

}

//Call calcAverageRating for saving average rating before saving a rating
reviewSchema.post('save', function() {
    this.constructor.calcAverageRating(this.tour);
});

//Chnaging average rating and number of ratings after updating and deleting a review
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function() {
    this.r.constructor.calcAverageRating(this.r.tour);
});

//Restrict for duplicate review
reviewSchema.index({tour: 1, user: 1}, {unique: true});

module.exports = mongoose.model('Review', reviewSchema);