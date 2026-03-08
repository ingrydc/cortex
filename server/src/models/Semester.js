const mongoose = require('mongoose')

const semesterSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:   { type: String, required: true, trim: true },   // ex: "2025.1"
    year:   { type: Number, required: true },
    period: { type: Number, required: true, enum: [1, 2] }, // 1 ou 2
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Garante que o mesmo usuário não tenha semestres duplicados
semesterSchema.index({ user: 1, year: 1, period: 1 }, { unique: true })

module.exports = mongoose.model('Semester', semesterSchema)
