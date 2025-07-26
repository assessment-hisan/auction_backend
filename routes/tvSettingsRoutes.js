// backend/routes/tvSettingsRoutes.js
import express from 'express';
import {
  getTvSettings,
  updateTvSettings,
  getUniqueSectionsAndPools // New import
} from '../controllers/tvSettingsController.js';

const router = express.Router();

// Middleware to pass io object to controllers
const passIo = (req, res, next) => {
  req.io = req.app.get('socketio');
  next();
};

router.get('/sections-and-pools', getUniqueSectionsAndPools); // New route
router.get('/:screenId', getTvSettings);
router.put('/:screenId', passIo, updateTvSettings);

export default router;