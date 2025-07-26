import Student from '../models/Student.js';
import Team from '../models/Team.js';

// Get all students
export const getStudents = async (req, res) => {
  console.log("[GET] Fetching all students");
  try {
    const students = await Student.find({}).populate("teamId");
    console.log("[GET] Found students:", students.length);
    res.status(200).json(students);
  } catch (error) {
    console.error("[GET] Error fetching students:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Add a single student
export const addSingleStudent = async (req, res) => {
  const io = req.io;
  console.log("[POST] Adding single student:", req.body);
  try {
    const student = new Student(req.body);
    await student.save();
    console.log("[POST] Student saved:", student);
    res.status(201).json(student);

    const updatedStudents = await Student.find({});
    io.emit('students_updated', updatedStudents);
    console.log("[SOCKET] Emitted students_updated (after single add)");
  } catch (error) {
    console.error("[POST] Error adding single student:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Add multiple students from JSON
export const addMultipleStudents = async (req, res) => {
  const io = req.io;
  const studentsData = req.body;
  console.log("[POST] Adding multiple students:", studentsData.length);

  try {
    if (!Array.isArray(studentsData)) {
      console.warn("[POST] Bulk insert failed: Not an array");
      return res.status(400).json({ message: "Request body must be an array of students." });
    }

    const insertedStudents = await Student.insertMany(studentsData.map(s => ({
      ...s,
      isCalled: s.isCalled || false,
      teamId: s.teamId || null,
      pool: s.pool || null
    })), { ordered: false });

    console.log(`[POST] Inserted ${insertedStudents.length} students`);
    res.status(201).json({ message: `${insertedStudents.length} students added.`, insertedStudents });

    const updatedStudents = await Student.find({});
    io.emit('students_updated', updatedStudents);
    console.log("[SOCKET] Emitted students_updated (after bulk insert)");

  } catch (error) {
    console.error("[POST] Error adding multiple students:", error);
    if (error.code === 11000) {
      const duplicates = error.writeErrors.map(err => err.err.errmsg);
      return res.status(409).json({ message: "Duplicate admission numbers found.", details: duplicates });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  const io = req.app.get('socketio'); // Access the Socket.IO instance from app locals
  const { id } = req.params;

  console.log(`[PUT] Updating student ${id}:`, req.body);
  try {
    const updatedStudent = await Student.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedStudent) {
      console.warn(`[PUT] Student ${id} not found`);
      return res.status(404).json({ message: "Student not found" });
    }
    console.log("[PUT] Student updated:", updatedStudent);
    res.status(200).json(updatedStudent);

    // Emit student_assigned event with the updated student data
    io.emit('student_assigned', updatedStudent);

    // Optionally emit students_updated with all students if needed
    // const allStudents = await Student.find({});
    // io.emit('students_updated', allStudents);
    console.log("[SOCKET] Emitted student_assigned");
  } catch (error) {
    console.error("[PUT] Error updating student:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  const io = req.io;
  const { id } = req.params;
  console.log(`[DELETE] Deleting student ${id}`);
  try {
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      console.warn(`[DELETE] Student ${id} not found`);
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json({ message: "Student deleted successfully" });

    const updatedStudents = await Student.find({});
    io.emit('students_updated', updatedStudents);
    console.log("[SOCKET] Emitted students_updated (after delete)");

  } catch (error) {
    console.error("[DELETE] Error deleting student:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Assign students to a pool
export const assignStudentsToPool = async (req, res) => {
  const io = req.io;
  const { studentIds, poolName } = req.body;
  console.log("[POOL] Assigning students to pool:", poolName, studentIds);
  try {
    if (!Array.isArray(studentIds) || studentIds.length === 0 || !poolName) {
      console.warn("[POOL] Invalid pool assignment input");
      return res.status(400).json({ message: "Invalid input: studentIds and poolName required" });
    }

    const result = await Student.updateMany(
      { _id: { $in: studentIds }, pool: { $ne: poolName } },
      { $set: { pool: poolName } }
    );

    console.log(`[POOL] Assigned ${result.modifiedCount} students to ${poolName}`);
    res.status(200).json({ message: `${result.modifiedCount} students assigned to ${poolName}.` });

    const updatedStudents = await Student.find({});
    io.emit('students_updated', updatedStudents);
    console.log("[SOCKET] Emitted students_updated (after pool assign)");

  } catch (error) {
    console.error("[POOL] Error assigning to pool:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Unassign student
export const unassignStudent = async (req, res) => {
  const io = req.io;
  const { id } = req.params;
  console.log(`[UNASSIGN] Unassigning student ${id}`);
  try {
    const student = await Student.findById(id);
    if (!student) {
      console.warn(`[UNASSIGN] Student ${id} not found`);
      return res.status(404).json({ message: "Student not found." });
    }

    const teams = await Team.find({
      $or: [
        { leader: student.name },
        { 'subLeaders': { $in: [student.name] } }
      ]
    });

    if (teams.length > 0) {
      console.warn(`[UNASSIGN] Student ${id} is a leader/sub-leader`);
      return res.status(400).json({ message: "Student is a team leader/sub-leader." });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: { teamId: null, isCalled: false } },
      { new: true }
    );

    console.log("[UNASSIGN] Student unassigned:", updatedStudent);
    res.status(200).json(updatedStudent);

    io.emit('student_unassigned', updatedStudent);
    const allStudents = await Student.find({});
    io.emit('students_updated', allStudents);
    console.log("[SOCKET] Emitted student_unassigned and students_updated");

  } catch (error) {
    console.error("[UNASSIGN] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
