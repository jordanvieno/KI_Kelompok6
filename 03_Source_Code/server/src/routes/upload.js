const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const supabase = require('../utils/supabase');

const router = express.Router();

// Configure multer with memory storage (file stored in RAM temporarily)
// File is then uploaded to Supabase Storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

/**
 * POST /api/upload
 * Upload an image file to Supabase Storage (admin only)
 * 
 * Returns the full public URL from Supabase Storage CDN.
 */
router.post('/', authenticate, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `${uniqueSuffix}${ext}`;

    // Upload to Supabase Storage bucket 'images'
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return res.status(500).json({ error: 'Upload to storage failed.' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    res.json({ path: publicUrl, filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed.' });
  }
});

module.exports = router;
