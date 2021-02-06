const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: [true, 'User\'s name required.'],
    },
    email: {
        type: String,
        required: true,
        unique: [true, "User's email required."],
        lowercase: true,
        validate: [validator.isEmail, "Please enter correct email."],
    },
    photo: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'guide', 'lead-guide'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, "User's passwords required."],
        minLength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please provide confirm password."],
        validate: {
            validator: function(val) {
                return val === this.password;
            },
            message: "Passwords doesn't match"
        }
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExp: Date
});

//HASHING PASSWORD BEFORE SAVE A USER DOCUMENT
userSchema.pre('save', async function(next) {
    //check password can be modified or not
    if(!this.isModified('password')) return next();

    //Hashed password save
    this.password = await bcrypt.hash(this.password, 12);

    //After validation no longer need of confirm password
    this.passwordConfirm = undefined;
});

//COMPARE PASSWORD BEFORE LOGIN
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.pre('save', function (next) {
    if(!this.isModified || this.isNew) return next();
    this.changedPasswordAt = Date.now() - 1000;
    next();
});

userSchema.pre('/^find/', function (next) {
    this.find({active: {$ne: false}});
    next();
});

userSchema.methods.changedPasswordAt = function (JWTTimesStamp) {
    if(this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return changedTimeStamp > JWTTimesStamp;
    }
    return false;
}

userSchema.methods.generateResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetTokenExp = Date.now() + 10*60*1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);
module.exports = User;