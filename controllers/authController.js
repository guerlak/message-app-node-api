const {validationResult} = require('express-validator/check');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const error = new Error('Validation Failed: Data input was incorrect.')
        error.statusCode = 422;
        error.data = errors.array()
        throw error;
    }

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    bcrypt.hash(password, 12).then(hashedPass => {
        const user = new User({
            name: name,
            email: email,
            status: "New User",
            password: hashedPass
        })
        return user.save()
        .then(result => {
            res.status(201).json({
                message: 'User registered',
                userId: result._id
            })
        })
    }).catch(err =>{
        console.log(err)
        const error = new Error('Password encryption fail')
        error.statusCode = 422;
        error.data = errors.array()
        throw error;
    })
}

exports.login = (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const error = new Error('Validation Failed: Data input was incorrect.')
        error.statusCode = 422;
        error.data = errors.array()
        throw error;
    }

    const email = req.body.email;
    const password = req.body.password;

    let loadedUser;

    User.findOne({email: email})
    .then(user => {
        if(!user){
            const error = new Error("User is not registered")
            error.statusCode = 401;
            throw error;
        }

        loadedUser = user;

        return bcrypt.compare(password, user.password)
    })
    .then(isEqual => {
        if(!isEqual){
            const error = new Error("Auth failed: E-mail or password is not correct")
            error.statusCode = 401;
            throw error;
        }

       const token = jwt.sign({email: loadedUser.email, userId: loadedUser._id.toString()}, 'guerlaksupersecret', {expiresIn: '1h'});

       res.status(201).json({
           message: "User logged",
           token: token,
           userId: loadedUser._id.toString()
       })
    })
    .catch(err => {
        console.log(err)
        const error = new Error('User is not registered')
        error.statusCode = 422;
        error.data = errors.array()
        next(error);
    })

}
