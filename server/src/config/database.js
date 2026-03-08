const mongoose = require('mongoose')

async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI não definida no .env!')
      return
    }
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ MongoDB conectado:', mongoose.connection.host)
  } catch (err) {
    console.error('❌ Erro ao conectar MongoDB:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
