import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildCrudRouter } from "../utils/crudFactory.js";

const schema = z.object({
  roomNumber: z.string().min(1, "Room number waa lagama maarmaan."),
  roomTypeId: z.coerce.number().int(),
  floor: z.coerce.number().int(),
  status: z.string().min(1).default("Available"),
  passportImagePath: z.string().optional().nullable(),
});

export const roomsRouter = buildCrudRouter({
  delegate: prisma.room,
  idField: "roomId",
  moduleKey: "Rooms",
  createSchema: schema,
  include: { roomType: true },
  orderBy: { roomId: "asc" },
  notFoundMessage: "Room lama helin.",
});
