import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  Cloudinary_url: process.env.CLOUDINARY_URL,
});

export default cloudinary;