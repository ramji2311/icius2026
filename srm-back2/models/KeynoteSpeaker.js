import mongoose from 'mongoose';

const keynoteSpeakerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  institution: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: '/placeholder.svg?height=300&width=300'
  },
  email: {
    type: String,
    trim: true
  },
  facultyProfile: {
    type: String,
    trim: true
  },
  linkedIn: {
    type: String,
    trim: true
  },
  orcid: {
    type: String,
    trim: true
  },
  biography: {
    type: String,
    required: true,
    trim: true
  },
  expertise: {
    type: [String],
    default: []
  },
  keynoteTitle: {
    type: String,
    required: true,
    trim: true
  },
  keynoteDescription: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

keynoteSpeakerSchema.index({ order: 1 });

export default mongoose.model('KeynoteSpeaker', keynoteSpeakerSchema);
