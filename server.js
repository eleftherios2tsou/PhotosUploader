require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { Readable } = require('stream');
const { v2: cloudinary } = require('cloudinary');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'wedding-andreas-elina',
        resource_type: resourceType,
        public_id: `photo_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(file.buffer).pipe(stream);
  });
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.post('/upload', upload.array('photos', 50), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  try {
    await Promise.all(req.files.map(uploadToCloudinary));
    console.log(`[${new Date().toLocaleTimeString()}] ${req.files.length} file(s) uploaded to Cloudinary`);
    res.json({ success: true, count: req.files.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload to cloud storage failed' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message });
});

// Start server when run directly (local dev); export app for Vercel
if (require.main === module) {
  function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) return iface.address;
      }
    }
    return 'localhost';
  }

  app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    const url = `http://${ip}:${PORT}`;
    console.log(`\n Wedding Photo Upload Server is running!`);
    console.log(`\n Local:   http://localhost:${PORT}`);
    console.log(` Network: ${url}`);
    console.log(`\n Run "npm run qr" in another terminal to show the QR code`);
    console.log(` Photos are saved to Cloudinary: wedding-andreas-elina folder\n`);
  });
}

module.exports = app;
