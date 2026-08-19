import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildCrudRouter } from "../utils/crudFactory.js";

const schema = z.object({
  guestId: z.coerce.number().int(),
  roomId: z.coerce.number().int().optional().nullable(),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  status: z.string().optional().default("Pending"),
});

export const reservationsRouter = buildCrudRouter({
  delegate: prisma.reservation,
  idField: "reservationId",
  moduleKey: "Reservations",
  createSchema: schema,
  include: { guest: true, room: { include: { roomType: true } } },
  orderBy: { reservationId: "desc" },
  notFoundMessage: "Reservation lama helin.",
});
