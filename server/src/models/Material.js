const mongoose = require('mongoose')

const materialSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    name:    { type: String, required: true, trim: true },
    type:    { type: String, enum: ['pdf', 'doc', 'img', 'other'], default: 'other' },
    url:     { type: String, required: true },   // URL pública no R2/S3
    key:     { type: String, required: true },   // chave no bucket (para deletar)
    size:    { type: Number, default: 0 },       // tamanho em bytes
    category:{ type: String, default: 'geral' }, // ex: "slides", "notas", "provas"
  },
  { timestamps: true }
)

module.exports = mongoose.model('Material', materialSchema)
