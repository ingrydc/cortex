const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/')
    const isPDF   = file.mimetype === 'application/pdf'
    return {
      folder:        `cortex/${req.user.id}`,
      resource_type: isImage ? 'image' : 'raw',
      format:        isPDF ? 'pdf' : undefined,
      public_id:     `${Date.now()}-${file.originalname.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`,
    }
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ALLOWED = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp',
    ]
    if (ALLOWED.includes(file.mimetype)) cb(null, true)
    else cb(new Error(`Tipo não permitido: ${file.mimetype}`))
  },
})

module.exports = { cloudinary, upload }
