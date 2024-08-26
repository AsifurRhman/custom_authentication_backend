

import mongoose, { Schema } from "mongoose";
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';





passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/google/callback',
},
async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  let user = await findUserByEmail(email);

  if (!user) {
    user = await createUser({
      name: profile.displayName,
      email,
      password: null, // Since it's a Google account, no need for a password
    });
  }

  done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => findUserById(id).then((user) => done(null, user)));




 const findUserByEmail = async (email) => {
  
    return UserModel.findOne({ email });
  };
  
const createUser = async ({ name, email, hashedPassword, phone, adminPassword, image, role, currentLicense, serial }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const newUser = { name, email, password: hashedPassword, phone, role, adminPassword, image, currentLicense, serial };
      const createdUser = await UserModel.create([newUser], { session });
  
      await session.commitTransaction();
      
      return { createdUser: createdUser[0] };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };
  
 const findUserById = async (id) => {
  
    return UserModel.findById(id);
};
  


const UserSchema = new Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  otp: { type: String },
  otpExpires: { type: Date }
}, { timestamps: true });

 const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);