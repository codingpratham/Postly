import { v2 as cloudinaryClient } from "cloudinary"

cloudinaryClient.config({
    url:process.env.CLOUDINARY_URL,
    secure:true
})

export const cloudinary = cloudinaryClient