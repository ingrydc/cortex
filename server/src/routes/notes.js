const express = require('express')
const ctrl    = require('../controllers/notesController')
const auth    = require('../middlewares/auth')

const router = express.Router()
router.use(auth)
router.patch('/:id',  ctrl.update)
router.delete('/:id', ctrl.remove)
module.exports = router
