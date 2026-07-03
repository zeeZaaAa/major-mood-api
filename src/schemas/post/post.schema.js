import mongoose from 'mongoose';
import { moodTypesEnum } from './enums/mood-types.enum.js';
import { postStatus } from './enums/status.enum.js';

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moodType: {
    type: String,
    required: [true, 'Mood type is required'],
    enum: Object.values(moodTypesEnum)
  },
  caption: {
    type: String,
    maxLength: [280, 'Keep it short and sweet!'],
    trim: true
  },
  faculty_name: {
    type: String,
    required: true
  },
  curriculum_name: {
    type: String,
    required: true
  },
  reactions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    }
  ],
  status: {
    type: String,
    enum: Object.values(postStatus),
    default: postStatus.ACTIVE,
    required: true
  },
  reporters: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reason: {
        type: String,
        required: true,
        trim: true,
        maxLength: 150
      },
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

}, { timestamps: true });

export default mongoose.model('Post', postSchema);