const express = require('express')
const ctrl    = require('../controllers/subjectsController')
const auth    = require('../middlewares/auth')
const { upload } = require('../config/storage')
const materialsCtrl = require('../controllers/materialsController')
const notesCtrl     = require('../controllers/notesController')

const router = express.Router()
router.use(auth)

router.get('/:id',           ctrl.getOne)
router.get('/:id/materials', ctrl.listMaterials)
router.patch('/:id',         ctrl.update)
router.delete('/:id',        ctrl.remove)

// Upload de material direto por subject id (sem semesterId na URL)
router.post('/:id/materials',
  upload.single('file'),
  (req, res, next) => {
    req.params.subjectId = req.params.id
    // semesterId não é necessário para o upload, apenas para organizar o path
    // Pegamos do subject no controller
    next()
  },
  async (req, res, next) => {
    try {
      const Subject = require('../models/Subject')
      const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id })
      if (!subject) return res.status(404).json({ message: 'Disciplina não encontrada.' })
      req.params.subjectId = subject._id.toString()
      // Reutiliza o upload controller passando o semId via subject
      req.semId = subject.semester.toString()
      next()
    } catch (err) { next(err) }
  },
  materialsCtrl.uploadBySubject
)

// Notas por subject id
router.get('/:id/notes',  notesCtrl.listBySubject)
router.post('/:id/notes', notesCtrl.createBySubject)

module.exports = router
