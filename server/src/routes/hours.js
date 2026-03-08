const express = require('express')
const ctrl    = require('../controllers/hoursController')
const auth    = require('../middlewares/auth')

const router = express.Router()
router.use(auth)

router.get('/summary',          ctrl.summary)
router.get('/activities',       ctrl.listActivities)
router.post('/activities',      ctrl.createActivity)
router.patch('/activities/:id', ctrl.updateActivity)
router.delete('/activities/:id',ctrl.deleteActivity)
router.put('/goals',            ctrl.setGoals)

module.exports = router
