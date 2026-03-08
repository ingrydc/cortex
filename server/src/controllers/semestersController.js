const Semester = require('../models/Semester')

// GET /api/semesters
async function list(req, res, next) {
  try {
    const semesters = await Semester.find({ user: req.user._id }).sort({ year: -1, period: -1 })
    res.json(semesters)
  } catch (err) { next(err) }
}

// POST /api/semesters
async function create(req, res, next) {
  try {
    const { name, year, period } = req.body
    const semester = await Semester.create({ user: req.user._id, name, year, period })
    res.status(201).json(semester)
  } catch (err) { next(err) }
}

// PATCH /api/semesters/:id
async function update(req, res, next) {
  try {
    const semester = await Semester.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!semester) return res.status(404).json({ message: 'Semestre não encontrado.' })
    res.json(semester)
  } catch (err) { next(err) }
}

// DELETE /api/semesters/:id
async function remove(req, res, next) {
  try {
    const semester = await Semester.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!semester) return res.status(404).json({ message: 'Semestre não encontrado.' })
    res.json({ message: 'Semestre removido.' })
  } catch (err) { next(err) }
}

module.exports = { list, create, update, remove }
