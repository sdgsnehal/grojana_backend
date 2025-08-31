import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded
    fs.unlinkSync(localFilePath);
    // remove the locally saved temporary file as the upload operation got failed
    return res;
  } catch (error) {
    //console.error("Cloudinary upload error:", error); // log the actual error
    try {
      fs.unlinkSync(localFilePath); // delete temp file even on failure
    } catch (err) {
      //console.error("Failed to delete temp file:", err);
    }
    return null;
  }
};
export { uploadOnCloudinary };
