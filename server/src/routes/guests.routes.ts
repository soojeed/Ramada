import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildCrudRouter } from "../utils/crudFactory.js";

const schema = z.object({
  fullName: z.string().min(1, "Full name waa lagama maarmaan."),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  passportImagePath: z.string().optional().nullable(),
});

export const guestsRouter = buildCrudRouter({
  delegate: prisma.guest,
  idField: "guestId",
  moduleKey: "Guests",
  createSchema: schema,
  orderBy: { guestId: "desc" },
  notFoundMessage: "Guest lama helin.",
});
