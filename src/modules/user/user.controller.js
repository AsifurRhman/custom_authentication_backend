import bcrypt from 'bcrypt';
import { UserModel } from './user.model.js';

import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from 'uuid';
import catchAsync from '../../utils/catchAsync.js';
import sendError from '../../utils/sendError.js';
import sendResponse from '../../utils/sendResponse.js';
import {
  createUser,

  findUserByEmail,

} from './user.service.js';
import { generateOTP, generateToken, hashPassword, sendOTPEmail } from './user.utils.js';
import { validateUserInput } from './user.validation.js';


export const registerUser = catchAsync(async (req, res) => {
  const { name, email, password, phone, image } = req.body;

  const validationError = validateUserInput(name, email, password);

  if (validationError) {
    return sendError(res, httpStatus.BAD_REQUEST, validationError);
  }

  const isUserRegistered = await findUserByEmail(email);
  if (isUserRegistered) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'You already have an account.',
    });
  }


  const hashedPassword = hashPassword(password);
  const { createdUser } = await createUser({
    name,
    email,
    hashedPassword,
    phone,

    image,
  });


  const token = generateToken({ name, email });

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  if (createdUser) {
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Welcome to Custom_Authentication',
      data: null,
    });
  }

});

// export const loginUser = catchAsync(async (req, res) => {
//   const { email, password } = req.body;

//   const user = await findUserByEmail(email);

//   if (!user) {
//     return sendError(res, httpStatus.NOT_FOUND, {
//       message: 'This account does not exist.',
//     });
//   }

//   const isPasswordValid = await bcrypt.compare(password, user.password);


//   if (!isPasswordValid) {
//     return sendError(res, httpStatus.UNAUTHORIZED, {
//       message: 'Invalid password.',
//     });
//   }

//   const token = generateToken({
//     id: user._id,
//     name: user.name,
//     email: user.email,
//     role: user.role,
//   });

//   res.cookie('token', token, {
//     httpOnly: true,
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'lax',
//   });

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Login successful',
//     data: {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//       token,
//     },
//   });
// });


export const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);

  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'This account does not exist.',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'Invalid password.',
    });
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

  // Save OTP to user document
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  // Send OTP to user's email
  await sendOTPEmail(user.email, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP sent to your email. Please verify to complete login.',
    data: { email: user.email }
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Please provide an email.',
    });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'This account does not exist.',
    });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
      user: process.env.Nodemailer_GMAIL,
      pass: process.env.Nodemailer_GMAIL_PASSWORD,
    },
  });
  const resetLink = `${process.env.url}/reset-password/${token}`; //frontend url
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0f0f0; padding: 20px;">
      <h1 style="text-align: center; color: #d3b06c; font-family: 'Times New Roman', Times, serif;">
        Custom <span style="color:#231f20; font-size: 0.9em;">Authentication</span>
      </h1>
      <div style="background-color: white; padding: 20px; border-radius: 5px;">
        <h2 style="color:#d3b06c">Hello!</h2>
        <p>You are receiving this email because we received a password reset request for your account.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetLink}" style="background-color:#d3b06c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>This password reset link will expire in 60 minutes.</p>
        <p>If you did not request a password reset, no further action is required.</p>
        <p>Regards,<br>DigitalToolsBD</p>
      </div>
      <p style="font-size: 12px; color: #666; margin-top: 10px;">If you're having trouble clicking the "Reset Password" button, copy and paste the URL into your web browser.</p>
    </div>
  `;


  const receiver = {
    from: "digitaltoolsbd@gmail.com",
    to: email,
    subject: "Reset Password.",
    html: emailContent,
  };



  await transporter.sendMail(receiver);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset link sent to your email. Please check!",
    data: null,
  });
});


export const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Please provide a password.',
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const user = await findUserByEmail(decoded.email);

  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'User not found.',
    });
  }

  const newPassword = await hashPassword(password);
  user.password = newPassword;
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: null,
  });
});

export const verifyOTP = catchAsync(async (req, res) => {
  const { otp } = req.body;
  const email = req.params.email;
  console.log(email)

  const user = await findUserByEmail(email);

  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'User not found.',
    });
  }

  if (user.otp !== otp || new Date() > user.otpExpires) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Invalid or expired OTP.',
    });
  }

  // Clear OTP fields
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Generate token and set cookie as before
  const token = generateToken({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      
      },
      token,
    },
  });
});

export const googleCallBack = catchAsync(
  async (req, res) => {
    const email = req.user.email;
  
    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
  
    // Save OTP to user document
    req.user.otp = otp;
    req.user.otpExpires = otpExpires;
    await req.user.save();
  
    // Send OTP to user's email
    await sendOTPEmail(email, otp);
  
    // Redirect to OTP verification page
   res.redirect(`/verify-otp?email=${email}`);
    }

);

