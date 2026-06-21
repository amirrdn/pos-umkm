import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from 'cloudinary';
import { getErrorMessage } from '../lib/errors';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Hanya diperbolehkan JPG, PNG, GIF, atau WEBP.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadSingleImage = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('image')(req, res, async (err: unknown) => {
    if (err) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(err, 'Gagal mengunggah gambar.'),
      });
      return;
    }

    if (!req.file) {
      next();
      return;
    }

    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'saaspos-products',
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('Cloudinary Upload Stream Error:', error);
            res.status(500).json({
              success: false,
              message: 'Gagal mengunggah gambar ke cloud storage: ' + error.message,
            });
            return;
          }

          if (result) {
            req.fileUrl = result.secure_url;
            next();
          } else {
            res.status(500).json({
              success: false,
              message: 'Gagal mendapatkan response unggahan cloud storage.',
            });
          }
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (uploadError: unknown) {
      console.error('Cloudinary Middleware Catch Error:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan sistem saat mengunggah ke Cloudinary.',
      });
    }
  });
};
