// backend/models/Student.js
import mongoose from 'mongoose';

const TeamStudentsScheme = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Students",
        default: null
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
}, {
    timestamps: true
});

const TeamStudents = mongoose.model('TeamStudents', TeamStudentsScheme);
export default TeamStudents;