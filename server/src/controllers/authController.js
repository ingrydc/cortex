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

module.exports = { register, login, me }
