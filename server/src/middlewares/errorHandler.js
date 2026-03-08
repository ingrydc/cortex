function errorHandler(err, req, res, next) {
  console.error('❌', err.message)

  // Erros de validação do Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ message: messages.join(', ') })
  }

  // Chave única duplicada (ex: e-mail já cadastrado)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({ message: `${field} já está em uso.` })
  }

  // Erros do Multer (upload)
  if (err.name === 'MulterError' || err.message?.includes('não permitido')) {
    return res.status(400).json({ message: err.message })
  }

  // Erro genérico
  const status = err.statusCode || 500
  res.status(status).json({
    message: err.message || 'Erro interno do servidor.',
  })
}

module.exports = errorHandler
