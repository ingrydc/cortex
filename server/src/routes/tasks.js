const express = require('express')
const ctrl    = require('../controllers/tasksController')
const auth    = require('../middlewares/auth')

const router = express.Router()
router.use(auth)
router.get('/',       ctrl.list)
router.post('/',      ctrl.create)
router.patch('/:id',  ctrl.update)
router.delete('/:id', ctrl.remove)
module.exports = router
