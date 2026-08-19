import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireModule } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const foodOrdersRouter = Router();
foodOrdersRouter.use(requireAuth, requireModule("FoodOrders"));

const orderInclude = {
  booking: { include: { guest: true } },
  orderItems: { include: { foodItem: true } },
} as const;

foodOrdersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.foodOrder.findMany({
      include: orderInclude,
      orderBy: { orderId: "desc" },
    });
    res.json({ success: true, data: orders });
  })
);

foodOrdersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await prisma.foodOrder.findUnique({
      where: { orderId: Number(req.params.id) },
      include: orderInclude,
    });
    if (!order) throw ApiError.notFound("Food order lama helin.");
    res.json({ success: true, data: order });
  })
);

const itemLine = z.object({
  itemId: z.coerce.number().int(),
  quantity: z.coerce.number().int().positive(),
});

const createSchema = z
  .object({
    bookingId: z.coerce.number().int().optional().nullable(),
    walkInCustomerName: z.string().optional().nullable(),
    items: z.array(itemLine).min(1, "Ugu yaraan hal food item waa in la doortaa."),
  })
  .refine((v) => v.bookingId || v.walkInCustomerName?.trim(), {
    message: "Booking ama Walk-in Customer Name waa lagama maarmaan.",
    path: ["bookingId"],
  });

foodOrdersRouter.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;

    const foodItems = await prisma.foodItem.findMany({
      where: { itemId: { in: body.items.map((i) => i.itemId) } },
    });
    if (foodItems.length !== body.items.length) {
      throw ApiError.badRequest("Mid ka mid ah food items-ka lama helin.");
    }

    const priceMap = new Map(foodItems.map((f) => [f.itemId, Number(f.price)]));
    const lines = body.items.map((i) => {
      const unitPrice = priceMap.get(i.itemId)!;
      return { ...i, unitPrice, totalPrice: unitPrice * i.quantity };
    });
    const totalPrice = lines.reduce((sum, l) => sum + l.totalPrice, 0);
    const isWalkIn = !body.bookingId;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.foodOrder.create({
        data: {
          bookingId: body.bookingId ?? null,
          walkInCustomerName: isWalkIn ? body.walkInCustomerName : null,
          isPaid: isWalkIn, // walk-in orders are paid immediately (cash)
          totalPrice,
          orderDate: new Date(),
          orderItems: {
            create: lines.map((l) => ({
              itemId: l.itemId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              totalPrice: l.totalPrice,
            })),
          },
        },
        include: orderInclude,
      });

      await tx.payment.create({
        data: {
          bookingId: body.bookingId ?? null,
          orderId: order.orderId,
          walkInCustomerName: isWalkIn ? body.walkInCustomerName : null,
          roomCharge: 0,
          foodCharge: totalPrice,
          amount: totalPrice,
          paymentMethod: "Cash",
          paymentDate: new Date(),
          status: isWalkIn ? "Paid" : "Pending",
          amountPaid: isWalkIn ? totalPrice : 0,
          category: "Food",
        },
      });

      if (isWalkIn) {
        await tx.finance.create({
          data: {
            description: `Walk-in Food Order #${order.orderId}`,
            income: totalPrice,
            expense: 0,
            transactionDate: new Date(),
            category: "Food",
          },
        });
      }

      return order;
    });

    res.status(201).json({ success: true, data: result });
  })
);

foodOrdersRouter.post(
  "/:id/mark-paid",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const order = await prisma.foodOrder.findUnique({ where: { orderId: id } });
    if (!order) throw ApiError.notFound("Food order lama helin.");

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.foodOrder.update({
        where: { orderId: id },
        data: { isPaid: true },
        include: orderInclude,
      });
      await tx.payment.updateMany({
        where: { orderId: id },
        data: { status: "Paid", amountPaid: Number(order.totalPrice) },
      });
      return updated;
    });

    res.json({ success: true, data: result });
  })
);

foodOrdersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const order = await prisma.foodOrder.findUnique({ where: { orderId: id } });
    if (!order) throw ApiError.notFound("Food order lama helin.");

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { orderId: id } });
      await tx.foodOrderItem.deleteMany({ where: { orderId: id } });
      await tx.foodOrder.delete({ where: { orderId: id } });
    });

    res.json({ success: true, message: "Food order si guul leh ayaa loo tirtiray." });
  })
);
