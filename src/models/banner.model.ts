import mongoose, { Schema, Document } from "mongoose";

interface BannerImage {
  url: string;
  publicId: string;
}

export interface IBanner extends Document {
  desktopImage: BannerImage;
  mobileImage: BannerImage;
  title: string;
  isActive: boolean;
  displayOrder: number;
}

const imageSchema = new Schema<BannerImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false, id: false }
);

const bannerSchema = new Schema<IBanner>(
  {
    desktopImage: { type: imageSchema, required: true },
    mobileImage: { type: imageSchema, required: true },
    title: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        delete ret._id;
      },
    },
  }
);

bannerSchema.index({ isActive: 1, displayOrder: 1 });

export const BannerModel = mongoose.model<IBanner>("Banner", bannerSchema);
