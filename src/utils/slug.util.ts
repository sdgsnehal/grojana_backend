import { ProductModel } from "../models/product.model";

const MAX_SLUG_ATTEMPTS = 5;

// "Kaju Katli (Premium)!" -> "kaju-katli-premium"
export const slugify = (text: string): string => {
  const slug = String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Names with no latin letters or digits would otherwise produce an empty slug
  return slug || "product";
};

// First free slug among: base, base-2, base-3, ...
export const generateUniqueProductSlug = async (
  name: string
): Promise<string> => {
  const base = slugify(name);

  const taken = await ProductModel.find(
    { slug: new RegExp(`^${base}(-\\d+)?$`) },
    "slug"
  ).lean();
  const takenSlugs = new Set(taken.map((product) => product.slug));

  if (!takenSlugs.has(base)) return base;

  let suffix = 2;
  while (takenSlugs.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
};

const isDuplicateSlugError = (error: any): boolean =>
  error?.code === 11000 && Boolean(error?.keyPattern?.slug);

// Runs `save` with a unique slug. If a concurrent write takes the same slug
// first, the unique index rejects ours and we retry with the next free one.
export const withUniqueProductSlug = async <T>(
  name: string,
  save: (slug: string) => Promise<T>
): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    const slug = await generateUniqueProductSlug(name);
    try {
      return await save(slug);
    } catch (error) {
      if (!isDuplicateSlugError(error) || attempt >= MAX_SLUG_ATTEMPTS) {
        throw error;
      }
    }
  }
};

// Gives a slug to a product that has none; never changes an existing slug.
export const assignMissingProductSlug = (productId: unknown, name: string) =>
  withUniqueProductSlug(name, (slug) =>
    ProductModel.findOneAndUpdate(
      { _id: productId, slug: { $in: [null, ""] } },
      { $set: { slug } },
      { new: true }
    )
  );
