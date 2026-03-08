const express = require('express')
const ctrl    = require('../controllers/semestersController')
const auth    = require('../middlewares/auth')

// Subjects e Materials são montados de dentro do semestre
const subjectsCtrl  = require('../controllers/subjectsController')
const materialsCtrl = require('../controllers/materialsController')
const notesCtrl     = require('../controllers/notesController')
const { upload }    = require('../config/storage')

const router = express.Router()

// Todas as rotas protegidas
router.use(auth)

router.get('/',    ctrl.list)
router.post('/',   ctrl.create)
router.patch('/:id',  ctrl.update)
router.delete('/:id', ctrl.remove)

// ── Disciplinas dentro do semestre ──
router.get( '/:semesterId/subjects', subjectsCtrl.list)
router.post('/:semesterId/subjects', subjectsCtrl.create)

// ── Materiais dentro da disciplina ──
router.get( '/:semesterId/subjects/:subjectId/materials', materialsCtrl.list)
router.post('/:semesterId/subjects/:subjectId/materials',
  upload.single('file'),
  materialsCtrl.upload
)

// ── Notas dentro da disciplina ──
router.get( '/:semesterId/subjects/:subjectId/notes', notesCtrl.list)
router.post('/:semesterId/subjects/:subjectId/notes', notesCtrl.create)

module.exports = router
