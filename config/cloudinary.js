const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to delete file from Cloudinary
const deleteFromCloudinary = async (public_id, resource_type = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type,
    });
    console.log("Cloudinary deletion result:", result);
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  deleteFromCloudinary,
};
