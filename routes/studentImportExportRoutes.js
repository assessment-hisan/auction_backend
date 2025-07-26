import express from 'express';
import multer from 'multer';
import fs from 'fs';
import Student from '../models/Student.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * GET /api/export-students
 * Optional query filters: ?class=10&section=A
 */
router.get('/export-students', async (req, res) => {
  try {
    const { class: studentClass, section } = req.query;

    const filter = {};
    if (studentClass) filter.class = studentClass;
    if (section) filter.section = section;

    const students = await Student.find(filter).select('-__v').lean();

    const modifiedStudents = students.map(student => ({
      ...student,
      teamId: null // Reset teamId
    }));

    res.setHeader('Content-Disposition', 'attachment; filename=students.json');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(modifiedStudents, null, 2));
  } catch (error) {
    console.error("Export failed:", error);
    res.status(500).json({ message: "Server error while exporting students." });
  }
});

/**
 * POST /api/import-students
 * Upload JSON file with field name 'studentsFile'
 */
router.post('/import-students', upload.single('studentsFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const data = fs.readFileSync(filePath, 'utf-8');
    const students = JSON.parse(data);

    const ops = students.map(student => {
      const { admissionNumber, ...rest } = student;
      return {
        updateOne: {
          filter: { admissionNumber },
          update: { $set: { ...rest, teamId: null } },
          upsert: true
        }
      };
    });

    await Student.bulkWrite(ops);
    fs.unlinkSync(filePath); // Clean up file

    res.status(200).json({ message: 'Students imported successfully.' });
  } catch (error) {
    console.error("Import failed:", error);
    res.status(500).json({ message: "Server error while importing students." });
  }
});

export default router;
