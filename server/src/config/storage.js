const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3')
const path = require('path')

const s3 = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region:   process.env.STORAGE_REGION || 'auto',
  credentials: {
    accessKeyId:     process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
})

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_SIZE_MB = 50

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.STORAGE_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Organiza por usuário: uploads/<userId>/<timestamp>-<originalname>
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

module.exports = { s3, upload }
