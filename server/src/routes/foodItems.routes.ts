import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildCrudRouter } from "../utils/crudFactory.js";

const schema = z.object({
  itemName: z.string().min(1, "Item name waa lagama maarmaan."),
  price: z.coerce.number().nonnegative(),
  category: z.string().optional().nullable(),
  imagePath: z.string().optional().nullable(),
});

export const foodItemsRouter = buildCrudRouter({
  delegate: prisma.foodItem,
  idField: "itemId",
  moduleKey: "FoodItems",
  createSchema: schema,
  orderBy: { itemId: "asc" },
  notFoundMessage: "Food Item lama helin.",
});
