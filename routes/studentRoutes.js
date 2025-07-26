// backend/routes/studentRoutes.js
import express from 'express';
import {
  getStudents,
  addSingleStudent,
  addMultipleStudents,
  updateStudent,
  deleteStudent,
  assignStudentsToPool,
  unassignStudent
} from '../controllers/studentController.js';

const router = express.Router();

// Middleware to pass io object to controllers
const passIo = (req, res, next) => {
  req.io = req.app.get('socketio'); // Get io instance from app locals
  next();
};

router.get('/', getStudents);
router.post('/single', passIo, addSingleStudent);
router.post('/bulk', passIo, addMultipleStudents);
router.put('/:id', passIo, updateStudent);
router.delete('/:id', passIo, deleteStudent);
router.post('/assign-to-pool', passIo, assignStudentsToPool); // New route for pool assignment
router.put('/unassign/:id', passIo, unassignStudent); // Route to unassign student from team

export default router;