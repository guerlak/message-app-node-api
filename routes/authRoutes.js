const express = require('express');

const {body} = require('express-validator/check');

const router = express.Router();

const isAuth = require('../middlewares/is-auth');

const User = require('../models/user');

const authController = require('../controllers/authController');

router.put('/signup', [body('email').isEmail().withMessage('Please enter a valid email')
                        .custom( (value,{req}) => {
                        return User.findOne({email: value}).then(userDoc => {
                            if(userDoc){
                                return Promise.reject('This email already exists');
                            }
                        });
                    })
                    .normalizeEmail(), 
                    body('password').trim().isLength({min: 3}),
                    body('name').trim().isLength({min: 2})], authController.signup);


router.post('/login', [
body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(), 
body('password').trim().isLength({min: 3})
]
, authController.login)

module.exports = router;