const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLUDE_NAME,
  api_key: process.env.CLUDE_API_KEY,
  api_secret: process.env.CLUDE_SECRET_KEY
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'GrocerEase', // The name of the folder in Cloudinary
  allowedFormats: ['jpg', 'png', 'jpeg'],
});

module.exports = { cloudinary, storage };