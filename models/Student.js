// backend/models/Student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  admissionNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  pool: {
    type: String,
    default: null, // Students can start unassigned to a pool
    trim: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);
export default Student;