// backend/models/Team.js
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
   leader: {
    type: mongoose.Schema.Types.ObjectId, // ✅ Reference by ID
    ref: 'Student',
    required: true,
  },
  subLeaders: {
    type: Map,
    of: {
      type: mongoose.Schema.Types.ObjectId, // ✅ Reference by ID
      ref: 'Student',
    },
    default: {},
  },
  color: {
    type: String, // Store hex color code, e.g., '#EF4444'
    required: true,
    trim: true
  },
}, {
  timestamps: true
});

const Team = mongoose.model('Team', teamSchema);
export default Team;