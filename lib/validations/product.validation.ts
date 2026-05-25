import { z } from "zod";

/**
 * Zod schemas for the Product API.
 *
 * Kept separate from `app/api/products/*` so the same schemas can be
 * reused by server actions, admin forms, or future clients without
 * pulling in any HTTP code.
 *
 * The shapes mirror the Prisma `Product` model and its `ProductStatus`
 * enum — keep them aligned when the schema changes.
 */

const PRODUCT_STATUS = ["ACTIVE", "INACTIVE"] as const;

const SORT_VALUES = ["latest", "price-low", "price-high"] as const;

/** Common reusable fragments. */
const name = z
  .string()
  .trim()
  .min(2, "Product name is too short.")
  .max(150, "Product name is too long.");

const description = z
  .string()
  .trim()
  .max(5000, "Description is too long.")
  .optional()
  .nullable();

const price = z
  .number({ error: "Price must be a number." })
  .finite()
  .nonnegative("Price cannot be negative.");

const discountPrice = z
  .number()
  .finite()
  .nonnegative("Discount price cannot be negative.")
  .optional()
  .nullable();

const stock = z
  .number({ error: "Stock must be a number." })
  .int("Stock must be a whole number.")
  .nonnegative("Stock cannot be negative.");

const image = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .nullable();

const images = z.array(z.string().trim().max(2048)).max(20).optional();

const badge = z.string().trim().max(40).optional().nullable();

/** Body for `POST /api/products`. */
export const createProductSchema = z
  .object({
    name,
    description,
    price,
    discountPrice,
    stock: stock.default(0),
    image,
    images,
    badge,
    status: z.enum(PRODUCT_STATUS).default("ACTIVE"),
    categoryId: z.string().trim().min(1, "Category is required."),
  })
  .refine(
    (data) =>
      data.discountPrice == null ||
      data.discountPrice <= data.price,
    {
      path: ["discountPrice"],
      message: "Discount price cannot exceed the regular price.",
    },
  );

/**
 * Body for `PATCH /api/products/[id]`.
 *
 * All fields optional. We rebuild from the inner shape (instead of
 * `.partial()` on the refined schema) so the cross-field discount check
 * is re-applied after merging with the existing product in the service.
 */
export const updateProductSchema = z
  .object({
    name: name.optional(),
    description,
    price: price.optional(),
    discountPrice,
    stock: stock.optional(),
    image,
    images,
    badge,
    status: z.enum(PRODUCT_STATUS).optional(),
    categoryId: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

/**
 * Query string for `GET /api/products`.
 *
 * `z.coerce.*` because URLSearchParams values are always strings.
 * Defaults keep the route simple — callers only need to pass what
 * they want to override.
 */
export const productQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).max(150).optional(),
    categoryId: z.string().trim().min(1).optional(),
    status: z.enum(PRODUCT_STATUS).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    sort: z.enum(SORT_VALUES).default("latest"),
  })
  .refine(
    (data) =>
      data.minPrice == null ||
      data.maxPrice == null ||
      data.minPrice <= data.maxPrice,
    {
      path: ["minPrice"],
      message: "minPrice cannot be greater than maxPrice.",
    },
  );

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
