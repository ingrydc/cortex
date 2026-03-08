const mongoose = require('mongoose')

// Categorias padrão de horas complementares (configuráveis por usuário)
const CATEGORIES = [
  'Ensino',
  'Pesquisa',
  'Extensão',
  'Cultura e Arte',
  'Esporte e Lazer',
  'Representação Estudantil',
  'Atividades Profissionais',
  'Outras',
]

const activitySchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:       { type: String, required: true, trim: true },
    category:    { type: String, required: true, enum: CATEGORIES },
    hours:       { type: Number, required: true, min: 0.5 },
    date:        { type: Date, required: true },
    institution: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
)

const goalSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true, enum: CATEGORIES },
    goal:     { type: Number, required: true, min: 1 }, // horas-meta
  },
  { timestamps: true }
)

goalSchema.index({ user: 1, category: 1 }, { unique: true })

const Activity = mongoose.model('Activity', activitySchema)
const Goal     = mongoose.model('Goal',     goalSchema)

module.exports = { Activity, Goal, CATEGORIES }
