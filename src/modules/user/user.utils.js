import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
export const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

export const generateToken = (payload) => {
  const expiresIn = '7d'; // 7 days expire
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });
};



export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.Nodemailer_GMAIL,
      pass: process.env.Nodemailer_GMAIL_PASSWORD,
    },
  });

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0f0f0; padding: 20px;">
      <h1 style="text-align: center; color: #d3b06c; font-family: 'Times New Roman', Times, serif;">
        Custom <span style="color:#231f20; font-size: 0.9em;">Authentication</span>
      </h1>
      <div style="background-color: white; padding: 20px; border-radius: 5px;">
        <h2 style="color:#d3b06c">Hello!</h2>
        <p>You are receiving this email because we received a login verification request for your account.</p>
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 24px; font-weight: bold; color: #d3b06c;">Your OTP: <span style="color: #231f20;">${otp}</span></p>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
        <p>Regards,<br>Custom_Authentication</p>
      </div>
      <p style="font-size: 12px; color: #666; margin-top: 10px;">This is an automated message, please do not reply.</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.Nodemailer_GMAIL,
    to: email,
    subject: 'Login Verification OTP',
    html: emailContent
  };

  await transporter.sendMail(mailOptions);
};