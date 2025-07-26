// backend/models/TvDisplaySettings.js
import mongoose from 'mongoose';

const tvDisplaySettingsSchema = new mongoose.Schema({
  screenId: {
    type: String,
    required: true,
    unique: true,
    enum: ['tv1Display', 'tv2Display'], // Restrict to known screen IDs
    trim: true
  },
  // --- Settings specific to TV1 (Uncalled Students) ---
  section: {
    type: String,
    default: 'Bidaya', // Default section for TV1
    trim: true
  },
  pool: {
    type: String,
    default: 'Pool 1', // Default pool for TV1
    trim: true
  },

  // --- Settings specific to TV2 (Called Students) ---
  displayMode: {
    type: String,
    default: 'All Teams', // e.g., 'All Teams', 'Specific Team', 'Top Teams'
    enum: ['All Teams', 'Specific Team', 'Top Teams'],
    trim: true
  },
  specificTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null // Null if displayMode is not 'Specific Team'
  },
  topTeamsCount: {
    type: Number,
    default: 3, // Number of top teams to show if displayMode is 'Top Teams'
    min: 1
  },
  tv2BannerMessage: {
    type: String,
    default: '', // Custom message displayed on TV2
    trim: true
  },
}, {
  timestamps: true // To track when settings were last updated
});

const TvDisplaySettings = mongoose.model('TvDisplaySettings', tvDisplaySettingsSchema);
export default TvDisplaySettings;