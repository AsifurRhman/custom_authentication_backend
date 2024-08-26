import mongoose from 'mongoose';
import { UserModel } from './user.model.js';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";
import httpStatus from 'http-status';


export const findUserByEmail = async (email) => {
  
  return UserModel.findOne({ email });
};

export const createUser = async ({ name, email, hashedPassword, phone, adminPassword, image, role, currentLicense, serial }) => {
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

export const findUserById = async (id) => {

  return UserModel.findById(id);
};

export const updateUserById = async (id, updateData) => {
  return UserModel.findByIdAndUpdate(id, updateData, { new: true });
};



export const deleteUserById = async (id) => {
  return UserModel.findByIdAndDelete(id);
};




