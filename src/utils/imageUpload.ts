import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Request } from "express";
import AppError from "../errors/AppError";
import "../config/cloudinary";

// ── Multer — memory storage use করবো
// disk storage না করে directly cloudinary তে upload হবে
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        "Invalid file type. Only JPEG, JPG, PNG and WEBP are allowed"
      )
    );
  }
};

// Single image upload
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single("image");

// Multiple images upload — max 5
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
}).array("images", 5);

// ── Buffer থেকে Cloudinary তে upload করো ─────────────
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `ecospark/${folder}`,
        resource_type: "image",
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new AppError(500, "Image upload failed: " + error.message));
        } else {
          resolve({
            url: result!.secure_url,
            public_id: result!.public_id,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// ── Cloudinary থেকে image delete করো ────────────────
export const deleteFromCloudinary = async (
  public_id: string
): Promise<void> => {
  await cloudinary.uploader.destroy(public_id);
};

// ── Multiple buffers upload করো ──────────────────────
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string
): Promise<string[]> => {
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.buffer, folder)
  );

  const results = await Promise.all(uploadPromises);
  return results.map((r) => r.url);
};