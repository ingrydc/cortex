const jwt  = require('jsonwebtoken')
const User = require('../models/User')

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, course } = req.body

    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ message: 'E-mail já cadastrado.' })

    const user  = await User.create({ name, email, password, course })
    const token = signToken(user._id)

    res.status(201).json({ user, token })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' })

    const match = await user.comparePassword(password)
    if (!match) return res.status(401).json({ message: 'Credenciais inválidas.' })

    const token = signToken(user._id)

    // Retorna sem a senha (toJSON já a remove)
    res.json({ user, token })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me  (rota protegida)
async function me(req, res) {
  res.json({ user: req.user })
}

// PATCH /api/auth/me
async function updateMe(req, res, next) {
  try {
    const allowed = ['name', 'course', 'avatar']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

    // Troca de senha
    if (req.body.newPassword) {
      if (!req.body.currentPassword) return res.status(400).json({ message: 'Senha atual obrigatória.' })
      const user = await User.findById(req.user._id).select('+password')
      const match = await user.comparePassword(req.body.currentPassword)
      if (!match) return res.status(401).json({ message: 'Senha atual incorreta.' })
      user.password = req.body.newPassword
      await user.save()
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    res.json({ user })
  } catch (err) { next(err) }
}

module.exports = { register, login, me, updateMe }
