const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    name:     { type: String, required: true, trim: true },
    professor:{ type: String, trim: true, default: '' },
    color:    { type: String, default: '#5c6bff' }, // cor da disciplina
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Subject', subjectSchema)
