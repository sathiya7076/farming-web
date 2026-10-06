const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const configured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

exports.deleteImages = async (images = []) => {
  if (!configured()) return;
  await Promise.all(
    images
      .filter((i) => i && i.publicId)
      .map((i) => cloudinary.uploader.destroy(i.publicId).catch((e) => console.error('Cloudinary delete failed:', e.message)))
  );
};

exports.uploadImages = async (files = [], folder = 'agriconnect/products') => {
  if (!files.length) return [];
  if (!configured()) throw new AppError('Image upload is not configured (set CLOUDINARY_* in backend/.env)', 503);
  const uploaded = [];
  try {
    for (const f of files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, out) =>
          err ? reject(err) : resolve(out)
        );
        stream.end(f.buffer);
      });
      uploaded.push({ url: result.secure_url, publicId: result.public_id });
    }
  } catch (e) {
    await exports.deleteImages(uploaded); // roll back partial uploads
    throw new AppError('Image upload failed: ' + e.message, 502);
  }
  return uploaded;
};
