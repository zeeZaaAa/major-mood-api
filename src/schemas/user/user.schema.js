import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  googleId: {
    type: String,
    required: [true, 'Google ID is required'],
    unique: true
  },
  level: { type: Number},
  curriculum_name: { type: String },
  faculty_name: { type: String },
  role: {
    type: String,
    default: "user"
  }

}, { timestamps: true });

export default mongoose.model('User', userSchema);