const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLUDE_NAME,
  api_key: process.env.CLUDE_API_KEY,
  api_secret: process.env.CLUDE_SECRET_KEY
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'GrocerEase', // The name of the folder in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    resource_type: 'auto'
  }
});

const userStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'GrocerEase/Users',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    resource_type: 'auto'
  }
});

module.exports = { cloudinary, storage, userStorage };