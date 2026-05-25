import mongoose, { Schema, Document, Types } from "mongoose";

interface Comment {
  user: Types.ObjectId;
  userName: string;
  content: string;
  date: Date;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  images: string[];
  author: Types.ObjectId;
  tags: string[];
  categories: string[];
  status: "draft" | "published";
  views: number;
  likes: number;
  comments: Comment[];
  isFeatured: boolean;
  publishedAt?: Date;
}

const commentSchema = new Schema<Comment>(
  {
    user: { type: Schema.Types.ObjectId, required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, trim: true },
    coverImage: { type: String },
    images: { type: [String], default: [] },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: { type: [String], default: [] },
    categories: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: [commentSchema], default: [] },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

blogSchema.index({ slug: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ title: "text", content: "text", tags: "text" });
blogSchema.index({ categories: 1 });
blogSchema.index({ isFeatured: 1 });

export const BlogModel = mongoose.model<IBlog>("Blog", blogSchema);
