const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
    subject:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    title:     { type: String, required: true, trim: true },
    dueDate:   { type: Date, default: null },
    priority:  { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    done:      { type: Boolean, default: false },
    doneAt:    { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Task', taskSchema)
