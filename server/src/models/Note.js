const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    title:   { type: String, required: true, trim: true },
    content: { type: String, default: '' }, // HTML do editor rich text
    tags:    [{ type: String, trim: true }],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Note', noteSchema)
