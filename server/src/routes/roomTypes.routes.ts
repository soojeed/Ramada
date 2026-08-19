import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildCrudRouter } from "../utils/crudFactory.js";

const schema = z.object({
  typeName: z.string().min(1, "Type name waa lagama maarmaan."),
  pricePerNight: z.coerce.number().nonnegative(),
  description: z.string().optional().nullable(),
  maxOccupancy: z.coerce.number().int().positive(),
});

export const roomTypesRouter = buildCrudRouter({
  delegate: prisma.roomType,
  idField: "roomTypeId",
  moduleKey: "RoomTypes",
  createSchema: schema,
  orderBy: { roomTypeId: "asc" },
  notFoundMessage: "Room Type lama helin.",
});
