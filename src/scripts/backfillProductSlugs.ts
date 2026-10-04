// One-off migration: gives every product without a slug a unique one.
// Safe to re-run; products that already have a slug are left untouched.
//
//   npm run migrate:slugs
import assert from "node:assert";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db";
import { ProductModel } from "../models/product.model";
import { slugify, assignMissingProductSlug } from "../utils/slug.util";

assert.equal(slugify("Motichoor Laddu"), "motichoor-laddu");
assert.equal(slugify("  Kaju Katli -- (Premium)! "), "kaju-katli-premium");
assert.equal(slugify("Café Barfi 250g"), "cafe-barfi-250g");
assert.equal(slugify("लड्डू"), "product");

const run = async () => {
  await connectDB();
  // Make sure the unique slug index exists before assigning slugs
  await ProductModel.init();

  // Oldest first, so the original product keeps the clean slug
  const products = await ProductModel.find(
    { slug: { $in: [null, ""] } },
    "name"
  ).sort({ createdAt: 1 });

  console.log(`${products.length} product(s) without a slug`);

  for (const product of products) {
    const updated = await assignMissingProductSlug(product._id, product.name);
    console.log(`${product.name} -> ${updated?.slug ?? "(already had a slug)"}`);
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Slug backfill failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
