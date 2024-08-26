import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import router from './src/routes/index.js';
import passport from 'passport';
import session from 'express-session';
import './config/passport.js'; // Configure Passport strategies
import { createUser, findUserByEmail } from './src/modules/user/user.service.js';
import { generateOTP, sendOTPEmail } from './src/modules/user/user.utils.js';

dotenv.config();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Initialize session middleware
app.use(
  session({
    secret: "customAuthentication",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
      sameSite: 'lax',
    },
  })
);

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(router);

// Add a route handler for the root path
app.get('/', (req, res) => {
  res.send('Welcome to the backend server!');
});

// Google OAuth routes
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    session: false,
  }),
  async (req, res) => {
    const { email } = req.user; // Get the user's email from the Google profile

    // Find user by email or create a new one
    let user = await findUserByEmail(email);

    if (!user) {
      // If user doesn't exist, create a new user
      user = await createUser({
        name: req.user.displayName,
        email,
        hashedPassword: null, // No password since it's Google OAuth
        phone: null,
        image: req.user.photos[0].value,
      });
    }

    // Generate OTP and send it to the user's email
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOTPEmail(user.email, otp);
    const decodedEmail = decodeURIComponent(user.email);
    console.log(decodedEmail)
    // Redirect the user to a verification page on the frontend
    res.redirect(`${process.env.url}/verify-otp?email=${decodedEmail}`);
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
