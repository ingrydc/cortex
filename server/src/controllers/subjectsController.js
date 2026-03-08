const Subject  = require('../models/Subject')
const Material = require('../models/Material')
const Task     = require('../models/Task')

// GET /api/semesters/:semesterId/subjects
async function list(req, res, next) {
  try {
    const subjects = await Subject.find({
      user: req.user._id,
      semester: req.params.semesterId,
    }).sort({ createdAt: 1 })

    // Calcula progresso por tarefas concluídas
    const withProgress = await Promise.all(subjects.map(async (s) => {
      const total = await Task.countDocuments({ user: req.user._id, subject: s._id })
      const done  = await Task.countDocuments({ user: req.user._id, subject: s._id, done: true })
      const progress = total === 0 ? 0 : Math.round((done / total) * 100)
      return { ...s.toJSON(), progress }
    }))

    res.json(withProgress)
  } catch (err) { next(err) }
}

// GET /api/subjects/:id  ← NOVO
async function getOne(req, res, next) {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id })
      .populate('semester', 'name year period')
    if (!subject) return res.status(404).json({ message: 'Disciplina não encontrada.' })
    const total = await Task.countDocuments({ user: req.user._id, subject: subject._id })
    const done  = await Task.countDocuments({ user: req.user._id, subject: subject._id, done: true })
    const progress = total === 0 ? 0 : Math.round((done / total) * 100)
    res.json({ ...subject.toJSON(), progress })
  } catch (err) { next(err) }
}

// GET /api/subjects/:id/materials  ← NOVO (não precisa de semesterId na URL)
async function listMaterials(req, res, next) {
  try {
    const materials = await Material.find({
      user:    req.user._id,
      subject: req.params.id,
    }).sort({ createdAt: -1 })
    res.json(materials)
  } catch (err) { next(err) }
}

// GET /api/subjects (todas do usuário)
async function listAll(req, res, next) {
  try {
    const subjects = await Subject.find({ user: req.user._id, semester: { $exists: true, $ne: null } })
      .populate('semester', 'name')
      .sort({ createdAt: 1 })

    const withProgress = await Promise.all(subjects.map(async (s) => {
      const total = await Task.countDocuments({ user: req.user._id, subject: s._id })
      const done  = await Task.countDocuments({ user: req.user._id, subject: s._id, done: true })
      const progress = total === 0 ? 0 : Math.round((done / total) * 100)
      return { ...s.toJSON(), progress }
    }))

    res.json(withProgress)
  } catch (err) { next(err) }
}

// POST /api/semesters/:semesterId/subjects
async function create(req, res, next) {
  try {
    const { name, professor, color } = req.body
    const subject = await Subject.create({
      user:     req.user._id,
      semester: req.params.semesterId,
      name, professor, color,
    })
    res.status(201).json(subject)
  } catch (err) { next(err) }
}

// PATCH /api/subjects/:id
async function update(req, res, next) {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!subject) return res.status(404).json({ message: 'Disciplina não encontrada.' })
    res.json(subject)
  } catch (err) { next(err) }
}

// DELETE /api/subjects/:id
async function remove(req, res, next) {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!subject) return res.status(404).json({ message: 'Disciplina não encontrada.' })
    res.json({ message: 'Disciplina removida.' })
  } catch (err) { next(err) }
}

module.exports = { list, listAll, getOne, listMaterials, create, update, remove }
