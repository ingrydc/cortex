const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3')
const path = require('path')

let s3Client
let uploadMiddleware

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_SIZE_MB = 50

if (process.env.STORAGE_BUCKET && process.env.STORAGE_ACCESS_KEY && process.env.STORAGE_SECRET_KEY && process.env.STORAGE_ENDPOINT) {
  s3Client = new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region:   process.env.STORAGE_REGION || 'auto',
    credentials: {
      accessKeyId:     process.env.STORAGE_ACCESS_KEY,
      secretAccessKey: process.env.STORAGE_SECRET_KEY,
    },
  })

  uploadMiddleware = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.STORAGE_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const ext      = path.extname(file.originalname)
        const basename = path.basename(file.originalname, ext)
          .replace(/[^a-z0-9]/gi, '-')
          .toLowerCase()
        const filename = `uploads/${req.user.id}/${Date.now()}-${basename}${ext}`
        cb(null, filename)
      },
    }),
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`))
      }
    },
  })
} else {
  console.warn('⚠️ Variáveis de ambiente de armazenamento não configuradas. Upload de arquivos desabilitado.')
  // Fallback para um storage em memória se as variáveis de ambiente não estiverem configuradas
  uploadMiddleware = multer({ storage: multer.memoryStorage() })
}

module.exports = { s3: s3Client, upload: uploadMiddleware }
