import multer, { StorageEngine } from "multer";
import { Request } from "express";

// const storage: StorageEngine = multer.diskStorage({
//   destination: function (
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: Error | null, destination: string) => void
//   ) {
//     console.log("temp file:", req.files);
//     cb(null, "./public/temp"); // save files in ./public/temp
//   },
//   filename: function (
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: Error | null, filename: string) => void
//   ) {
//     cb(null, file.originalname); // keep original file name
//   },
// });

const storage: StorageEngine = multer.memoryStorage();

export const upload = multer({ storage });
