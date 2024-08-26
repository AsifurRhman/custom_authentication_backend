import express from 'express';
import { adminMiddleware } from '../../middleware/auth.js';
import validateRequest from '../../middleware/validateRequest.js';

import passport from 'passport';


import {

  forgotPassword,

  googleCallBack,

  loginUser,
  registerUser,
  resetPassword,
  verifyOTP,

} from './user.controller.js';
import {
  loginValidationSchema,
  registerUserValidationSchema,

} from './user.validation.js';

const router = express.Router();

router.post(
  '/register',
  validateRequest(registerUserValidationSchema),
  registerUser,
);
router.post('/login', validateRequest(loginValidationSchema), loginUser);
router.post('/forget-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-otp/:email', verifyOTP);


// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),googleCallBack);





export default router;