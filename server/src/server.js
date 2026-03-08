require('dotenv').config()

const express      = require('express')
const cors         = require('cors')
const connectDB    = require('./config/database')
const errorHandler = require('./middlewares/errorHandler')

// Rotas
const authRoutes      = require('./routes/auth')
const semestersRoutes = require('./routes/semesters')
const subjectsRoutes  = require('./routes/subjects')
const materialsRoutes = require('./routes/materials')
const notesRoutes     = require('./routes/notes')
const tasksRoutes     = require('./routes/tasks')
const hoursRoutes     = require('./routes/hours')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middlewares globais ──
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Healthcheck ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', project: 'Cortex API', version: '0.1.0' })
})

// ── Rotas ──
app.use('/api/auth',      authRoutes)
app.use('/api/semesters', semestersRoutes)
app.use('/api/subjects',  subjectsRoutes)
app.use('/api/materials', materialsRoutes)
app.use('/api/notes',     notesRoutes)
app.use('/api/tasks',     tasksRoutes)
app.use('/api/hours',     hoursRoutes)

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' })
})

// ── Error handler ──
app.use(errorHandler)

// ── Inicialização ──
async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`🧠 Cortex API rodando em http://localhost:${PORT}`)
    console.log(`📋 Ambiente: ${process.env.NODE_ENV || 'development'}`)
  })
}

start()
