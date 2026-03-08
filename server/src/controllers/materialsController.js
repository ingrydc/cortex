const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { s3 }     = require('../config/storage')
const Material   = require('../models/Material')
const Subject    = require('../models/Subject')

function mimeToType(mimetype) {
  if (mimetype === 'application/pdf') return 'pdf'
  if (mimetype.startsWith('image/'))   return 'img'
  if (mimetype.includes('word'))       return 'doc'
  return 'other'
}

// GET /api/semesters/:semesterId/subjects/:subjectId/materials
async function list(req, res, next) {
  try {
    const materials = await Material.find({
      user:    req.user._id,
      subject: req.params.subjectId,
    }).sort({ createdAt: -1 })
    res.json(materials)
  } catch (err) { next(err) }
}

// Helper interno de criação de material
async function _createMaterial({ user, subjectId, file, category, name }) {
  return Material.create({
    user,
    subject:  subjectId,
    name:     name || file.originalname,
    type:     mimeToType(file.mimetype),
    url:      `${process.env.STORAGE_PUBLIC_URL}/${file.key}`,
    key:      file.key,
    size:     file.size,
    category: category || 'geral',
  })
}

// POST /api/semesters/:semesterId/subjects/:subjectId/materials
async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' })
    const material = await _createMaterial({
      user:      req.user._id,
      subjectId: req.params.subjectId,
      file:      req.file,
      category:  req.body.category,
      name:      req.body.name,
    })
    res.status(201).json(material)
  } catch (err) { next(err) }
}

// POST /api/subjects/:id/materials  (rota simplificada sem semesterId)
async function uploadBySubject(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' })
    const material = await _createMaterial({
      user:      req.user._id,
      subjectId: req.params.id,
      file:      req.file,
      category:  req.body.category,
      name:      req.body.name,
    })
    res.status(201).json(material)
  } catch (err) { next(err) }
}

// PATCH /api/materials/:id
async function update(req, res, next) {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name: req.body.name, category: req.body.category },
      { new: true }
    )
    if (!material) return res.status(404).json({ message: 'Material não encontrado.' })
    res.json(material)
  } catch (err) { next(err) }
}

// DELETE /api/materials/:id
async function remove(req, res, next) {
  try {
    const material = await Material.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!material) return res.status(404).json({ message: 'Material não encontrado.' })
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key:    material.key,
    }))
    res.json({ message: 'Material removido.' })
  } catch (err) { next(err) }
}

module.exports = { list, upload, uploadBySubject, update, remove }
