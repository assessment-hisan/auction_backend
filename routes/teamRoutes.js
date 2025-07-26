// backend/routes/teamRoutes.js
import express from 'express';
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam
} from '../controllers/teamController.js';

const router = express.Router();

// Middleware to pass io object to controllers
const passIo = (req, res, next) => {
  req.io = req.app.get('socketio');
  next();
};

router.get('/', getTeams);
router.post('/', passIo, createTeam);
router.put('/:id', passIo, updateTeam);
router.delete('/:id', passIo, deleteTeam);

export default router;