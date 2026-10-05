// Disk uploads for project images, avatars, resumes, etc.
// Files land in ./uploads and are served at /uploads/<filename>.
const path = require('path');
const multer = require('multer');

// Images + PDFs only. Keep the list tight so we never store executables.
const ALLOWED = /jpe?g|png|webp|svg|pdf/;

const storage = multer.diskStorage({
  // On Vercel serverless the filesystem is read-only except /tmp (ephemeral).
  // Uploads won't persist there — use image URLs for permanent images.
  destination: (req, file, cb) => cb(null, process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const ok = ALLOWED.test(ext) && ALLOWED.test(file.mimetype);
  if (!ok) return cb(new Error('Only jpg, jpeg, png, webp, svg and pdf files are allowed'));
  cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
