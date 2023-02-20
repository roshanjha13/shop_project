//manage authantication related route

const express = require('express')
const { check,body } = require('express-validator/check')

const authController = require('../controllers/auth')
const User = require('../models/user')

const router = express.Router();

router.get('/login',authController.getLogin);

router.get('/signup',authController.getSignup);

router.post('/login',authController.postLogin);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('please enter a valid email address..')
            .normalizeEmail(),
        body('password','password has to be valid..')
            .isLength({min:5})
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin
)

router.post(
    '/signup', 
   [  
        body('email') // this is for email
            .isEmail()
            .withMessage('please enter a valid email')
            .custom((value,{req})=>{ // add validator 
                // if(value=== 'jharoshan618@gmail.com'){
                //     throw new Error('this email is forbidden..')
                // }
                // return true
            //if you succeed then return true ,if you dont return true then output give invalid input
                
            //updated one

            return User.findOne({email : value })
                .then(userDoc=>{
                    if(userDoc){
                       return Promise.reject('email is already exists')
                    }
                })
        })
        .normalizeEmail(),
        body('password')
            .isLength({min:5})
            .withMessage
            (
                `please enter a valid password with contain only 
                numbers and text and at least 5 characters`
            )
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, {req})=>{
                if(value !== req.body.password){
                    //check password is equal or not
                    throw new Error(
                        `your password not match please check your password`
                    )
                }
                return true 
            })
    ],
    authController.postSignup
)

router.post('/logout',authController.postLogout);

router.get('/reset',authController.getReset);

router.post('/reset',authController.postReset);

router.get('/reset/:token',authController.getNewPassword)

router.post('/new-password',authController.postNewPassword)



module.exports = router