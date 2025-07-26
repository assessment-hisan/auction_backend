import Team from '../models/Team.js'
import Student from '../models/Student.js'
import TeamStudents from '../models/TeamStudents.js';
import { error } from 'console';

// Get all teams
export const callStudents = async (req, res) => {
    try {
        const { studentId, teamId } = req.body;
        if (!studentId || !teamId) {
            return error("not teamId or studentId")
        }
        const teamStudent = new TeamStudents({ student: studentId, team: teamId })
        await Student.findByIdAndUpdate(
            studentId,
            { teamId }
        );

        await teamStudent.save()
        res.status(200).json(teamStudent)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

