const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name of a tour must be required."],
        unique: true,
        trim: true,
        minlength: [10, 'Name must be more than 10 characters.'],
        maxlength: [50, 'Name must be less than 50 characters.']
    },
    slug: String,
    ratingsAverage: {
        type: Number,
        default: 4.5,
        max: [5.0, 'Average ratings below 5.0'],
        min: [1.0, 'Average ratings above 1.0'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have max group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: ['Difficulty either: easy or medium or difficult']
        }
    },
    secretTour: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number,
        required: [true, "Price must be enter for a tour."]
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                return val < this.price
            },
            message: "Discount price ({VALUE}) should be below regular price"
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have Summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have Cover Image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    //Locations data model for a tour
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: "Point",
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
    },
    locations: [
        {
            type: {
                type: String,
                default: "Point",
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

//Vertual Middleware for calculate total weeks 
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

//Vertual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
// .pre()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, {lower: true});
    next();
});

//Set index for increased performance
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});

// .post()
// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
// });

//QUERY MIDDLEWARE: runs before .find()
// .pre()
tourSchema.pre('find', function (next) {
    this.find({ secretTour: { $ne: true } });
    next();  
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;