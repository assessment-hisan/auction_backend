// backend/controllers/tvSettingsController.js
import TvDisplaySettings from '../models/TvDisplaySettings.js';
import Student from '../models/Student.js'; // To check pool completion for auto-advance

// Helper function to get all unique sections and pools from existing students
export const getUniqueSectionsAndPools = async (req, res) => {
  try {
    const sections = await Student.distinct('section', { section: { $ne: null, $ne: '' } });
    const pools = await Student.distinct('pool', { pool: { $ne: null, $ne: '' } });

    // Ensure all 8 pools are always included for selection
    const allPossiblePools = Array.from({ length: 8 }, (_, i) => `Pool ${i + 1}`);
    const uniquePools = [...new Set([...allPossiblePools, ...pools])].sort();

    res.status(200).json({ sections: sections.sort(), pools: uniquePools });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get TV display settings for a specific screenId (tv1Display or tv2Display)
export const getTvSettings = async (req, res) => {
  const { screenId } = req.params;
  try {
    let settings = await TvDisplaySettings.findOne({ screenId });
    if (!settings) {
      // If settings don't exist, create default ones based on screenId
      const defaultData = screenId === 'tv1Display' ?
        { screenId: 'tv1Display', section: 'Bidayay', pool: 'Pool 1', autoAdvancePool: false, autoAdvanceDelaySeconds: 10, tv1BannerMessage: '' } :
        { screenId: 'tv2Display', displayMode: 'All Teams', specificTeamId: null, topTeamsCount: 3, tv2BannerMessage: '' };
      settings = new TvDisplaySettings(defaultData);
      await settings.save();
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update TV display settings for a specific screenId
export const updateTvSettings = async (req, res) => {
  const { screenId } = req.params;
  const updateFields = req.body; // Contains fields like section, pool, autoAdvancePool, displayMode, etc.

  try {
    const updatedSettings = await TvDisplaySettings.findOneAndUpdate(
      { screenId },
      { $set: updateFields },
      { new: true, upsert: true } // Create if not exists, return new doc
    );

    const io = req.app.get('socketio');

    // Emit WebSocket event based on screenId
    if (screenId === 'tv1Display') {
      io.emit('tv1_settings_updated', updatedSettings);
    } else if (screenId === 'tv2Display') {
      io.emit('tv2_settings_updated', updatedSettings);
    }

    res.status(200).json(updatedSettings);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Function to check and automatically advance TV1 pool
// This function should be called after a student is assigned to a team.
export const checkAndAdvanceTv1Pool = async (io) => {
  try {
    const tv1Settings = await TvDisplaySettings.findOne({ screenId: 'tv1Display' });
    if (!tv1Settings || !tv1Settings.autoAdvancePool) {
      // Auto-advance is not enabled or settings not found
      return;
    }

    const { section, pool, autoAdvanceDelaySeconds } = tv1Settings;

    // Get all uncalled students in the current section and pool
    const uncalledStudentsInCurrentPool = await Student.countDocuments({
      isCalled: false,
      section: section,
      pool: pool
    });

    if (uncalledStudentsInCurrentPool === 0) {
      // All students in the current pool are called! Advance to next pool.
      const allPossiblePools = Array.from({ length: 8 }, (_, i) => `Pool ${i + 1}`);
      const currentPoolIndex = allPossiblePools.indexOf(pool);

      if (currentPoolIndex !== -1 && currentPoolIndex < allPossiblePools.length - 1) {
        const nextPool = allPossiblePools[currentPoolIndex + 1];

        // Introduce a delay before advancing
        setTimeout(async () => {
          const updatedSettings = await TvDisplaySettings.findOneAndUpdate(
            { screenId: 'tv1Display' },
            { $set: { pool: nextPool } },
            { new: true }
          );
          io.emit('tv1_settings_updated', updatedSettings);
          console.log(`TV1 auto-advanced to Section: ${updatedSettings.section}, Pool: ${updatedSettings.pool}`);
        }, autoAdvanceDelaySeconds * 1000); // Convert seconds to milliseconds
      } else {
        console.log(`All pools in Section ${section} completed or last pool reached.`);
        // Optionally, you could emit an event indicating section completion
        io.emit('section_completed', { section: section });
      }
    }
  } catch (error) {
    console.error("Error in checkAndAdvanceTv1Pool:", error);
  }
};

export const tv1 = async () => {
  try {
    const tv1 = await TvDisplaySettings.find({ screenId: "tv1Display" })

    res.send(tv1);
  } catch (error) {
    console.error("error tv1 data")
  }

}