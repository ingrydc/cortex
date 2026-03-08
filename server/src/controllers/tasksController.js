const Task = require('../models/Task')

// GET /api/tasks  (todas as tarefas do usuário, opcionalmente filtradas)
async function list(req, res, next) {
  try {
    const filter = { user: req.user._id }
    if (req.query.subject) filter.subject = req.query.subject
    if (req.query.done !== undefined) filter.done = req.query.done === 'true'

    const tasks = await Task.find(filter)
      .populate('subject', 'name color')
      .sort({ dueDate: 1, createdAt: -1 })

    res.json(tasks)
  } catch (err) { next(err) }
}

// POST /api/tasks
async function create(req, res, next) {
  try {
    const { title, dueDate, priority, subject } = req.body
    const task = await Task.create({
      user: req.user._id,
      title, dueDate, priority,
      subject: subject || null,
    })
    res.status(201).json(await task.populate('subject', 'name color'))
  } catch (err) { next(err) }
}

// PATCH /api/tasks/:id
async function update(req, res, next) {
  try {
    // Se marcar como done, registra a data
    if (req.body.done === true)  req.body.doneAt = new Date()
    if (req.body.done === false) req.body.doneAt = null

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('subject', 'name color')

    if (!task) return res.status(404).json({ message: 'Tarefa não encontrada.' })
    res.json(task)
  } catch (err) { next(err) }
}

// DELETE /api/tasks/:id
async function remove(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!task) return res.status(404).json({ message: 'Tarefa não encontrada.' })
    res.json({ message: 'Tarefa removida.' })
  } catch (err) { next(err) }
}

module.exports = { list, create, update, remove }
