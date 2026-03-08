const Note = require('../models/Note')

// GET /api/semesters/:semesterId/subjects/:subjectId/notes
async function list(req, res, next) {
  try {
    const notes = await Note.find({
      user:    req.user._id,
      subject: req.params.subjectId,
    }).sort({ updatedAt: -1 })
    res.json(notes)
  } catch (err) { next(err) }
}

// GET /api/subjects/:id/notes  (rota simplificada)
async function listBySubject(req, res, next) {
  try {
    const notes = await Note.find({ user: req.user._id, subject: req.params.id })
      .sort({ updatedAt: -1 })
    res.json(notes)
  } catch (err) { next(err) }
}

// POST /api/semesters/:semesterId/subjects/:subjectId/notes
async function create(req, res, next) {
  try {
    const { title, content, tags } = req.body
    const note = await Note.create({
      user:    req.user._id,
      subject: req.params.subjectId,
      title, content, tags,
    })
    res.status(201).json(note)
  } catch (err) { next(err) }
}

// POST /api/subjects/:id/notes  (rota simplificada)
async function createBySubject(req, res, next) {
  try {
    const { title, content, tags } = req.body
    const note = await Note.create({
      user:    req.user._id,
      subject: req.params.id,
      title, content, tags,
    })
    res.status(201).json(note)
  } catch (err) { next(err) }
}

// PATCH /api/notes/:id
async function update(req, res, next) {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!note) return res.status(404).json({ message: 'Nota não encontrada.' })
    res.json(note)
  } catch (err) { next(err) }
}

// DELETE /api/notes/:id
async function remove(req, res, next) {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!note) return res.status(404).json({ message: 'Nota não encontrada.' })
    res.json({ message: 'Nota removida.' })
  } catch (err) { next(err) }
}

module.exports = { list, listBySubject, create, createBySubject, update, remove }
