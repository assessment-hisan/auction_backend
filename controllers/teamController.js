import Team from '../models/Team.js'
import Student from '../models/Student.js'

// Get all teams
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({})
      .populate('leader')
      .populate({ path: 'subLeaders.$*' }) // Populate all subLeader references

    res.status(200).json(teams)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Create a new team
export const createTeam = async (req, res, io) => {
  const { name, leader, subLeaders, color } = req.body

  try {
    const newTeam = new Team({ name, leader, subLeaders, color })
    await newTeam.save()

    // ✅ Update leader student by _id
    await Student.findByIdAndUpdate(
      leader,
      { isCalled: true, teamId: newTeam._id },
      { new: true }
    )

    // ✅ Update sub-leaders (Object values are IDs)
    const subLeaderIds = Object.values(subLeaders).filter(Boolean)
    if (subLeaderIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: subLeaderIds } },
        { isCalled: true, teamId: newTeam._id }
      )
    }

    // Re-fetch populated team
    const populatedTeam = await Team.findById(newTeam._id)
      .populate('leader')
      .populate({ path: 'subLeaders.$*' })

    res.status(201).json(populatedTeam)

    // Emit WebSocket updates
    const updatedTeams = await Team.find({})
      .populate('leader')
      .populate({ path: 'subLeaders.$*' })
    io.emit('teams_updated', updatedTeams)

    const updatedStudents = await Student.find({})
    io.emit('students_updated', updatedStudents)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Team name already exists." })
    }
    res.status(400).json({ message: error.message })
  }
}

// Update a team
export const updateTeam = async (req, res, io) => {
  const { id } = req.params
  try {
    const updatedTeam = await Team.findByIdAndUpdate(id, req.body, { new: true })
      .populate('leader')
      .populate({ path: 'subLeaders.$*' })

    if (!updatedTeam) {
      return res.status(404).json({ message: "Team not found" })
    }

    res.status(200).json(updatedTeam)

    const allTeams = await Team.find({})
      .populate('leader')
      .populate({ path: 'subLeaders.$*' })
    io.emit('teams_updated', allTeams)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete a team
export const deleteTeam = async (req, res, io) => {
  const { id } = req.params
  try {
    const deletedTeam = await Team.findByIdAndDelete(id)
    if (!deletedTeam) {
      return res.status(404).json({ message: "Team not found" })
    }

    // Unassign students who belonged to the team
    await Student.updateMany(
      { teamId: id },
      { $set: { teamId: null, isCalled: false } }
    )

    res.status(200).json({ message: "Team deleted successfully" })

    const updatedTeams = await Team.find({})
      .populate('leader')
      .populate({ path: 'subLeaders.$*' })
    io.emit('teams_updated', updatedTeams)

    const updatedStudents = await Student.find({})
    io.emit('students_updated', updatedStudents)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
