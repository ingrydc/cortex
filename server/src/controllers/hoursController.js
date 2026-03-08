const { Activity, Goal, CATEGORIES } = require('../models/ComplementaryHours')

// GET /api/hours/summary
// Retorna: atividades agrupadas por categoria + metas + totais
async function summary(req, res, next) {
  try {
    const userId = req.user._id

    const [activities, goals] = await Promise.all([
      Activity.find({ user: userId }).sort({ date: -1 }),
      Goal.find({ user: userId }),
    ])

    // Agrupa horas por categoria
    const byCategory = {}
    for (const cat of CATEGORIES) {
      const acts  = activities.filter(a => a.category === cat)
      const total = acts.reduce((sum, a) => sum + a.hours, 0)
      const goal  = goals.find(g => g.category === cat)
      byCategory[cat] = {
        category:    cat,
        totalHours:  total,
        goalHours:   goal?.goalId ? goal.goal : null,
        goalId:      goal?._id || null,
        activities:  acts,
        progress:    goal?.goal ? Math.min(100, Math.round((total / goal.goal) * 100)) : null,
      }
    }

    const grandTotal = activities.reduce((sum, a) => sum + a.hours, 0)
    const totalGoal  = goals.reduce((sum, g) => sum + g.goal, 0)

    res.json({
      summary: Object.values(byCategory).filter(c => c.totalHours > 0 || c.goalHours),
      all:     Object.values(byCategory),
      grandTotal,
      totalGoal,
      categories: CATEGORIES,
    })
  } catch (err) { next(err) }
}

// GET /api/hours/activities
async function listActivities(req, res, next) {
  try {
    const filter = { user: req.user._id }
    if (req.query.category) filter.category = req.query.category
    const activities = await Activity.find(filter).sort({ date: -1 })
    res.json(activities)
  } catch (err) { next(err) }
}

// POST /api/hours/activities
async function createActivity(req, res, next) {
  try {
    const { title, category, hours, date, institution, description } = req.body
    const activity = await Activity.create({
      user: req.user._id,
      title, category, hours, date, institution, description,
    })
    res.status(201).json(activity)
  } catch (err) { next(err) }
}

// PATCH /api/hours/activities/:id
async function updateActivity(req, res, next) {
  try {
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!activity) return res.status(404).json({ message: 'Atividade não encontrada.' })
    res.json(activity)
  } catch (err) { next(err) }
}

// DELETE /api/hours/activities/:id
async function deleteActivity(req, res, next) {
  try {
    const activity = await Activity.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!activity) return res.status(404).json({ message: 'Atividade não encontrada.' })
    res.json({ message: 'Atividade removida.' })
  } catch (err) { next(err) }
}

// PUT /api/hours/goals  — upsert de todas as metas de uma vez
async function setGoals(req, res, next) {
  try {
    const { goals } = req.body // [{ category, goal }]
    if (!Array.isArray(goals)) return res.status(400).json({ message: 'Formato inválido.' })

    const ops = goals.map(({ category, goal }) => ({
      updateOne: {
        filter: { user: req.user._id, category },
        update: { $set: { goal: Number(goal) } },
        upsert: true,
      }
    }))

    await Goal.bulkWrite(ops)
    const updated = await Goal.find({ user: req.user._id })
    res.json(updated)
  } catch (err) { next(err) }
}

module.exports = { summary, listActivities, createActivity, updateActivity, deleteActivity, setGoals }
