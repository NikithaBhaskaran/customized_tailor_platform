import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reject"),
    note: z.string().min(2),
  }),
  z.object({
    action: z.literal("clarification"),
    note: z.string().min(2),
  }),
  z.object({
    action: z.literal("quote"),
    fabricCost: z.number().min(0),
    stitchingCost: z.number().min(0),
    embroideryCost: z.number().min(0),
    deliveryCost: z.number().min(0),
    totalPrice: z.number().positive(),
    estimatedDeliveryDays: z.number().int().positive(),
    currency: z.string().min(3).max(3).default("USD"),
    message: z.string().optional(),
    validUntil: z.string().datetime().optional(),
  }),
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TAILOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  const body = await request.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action payload." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const payload = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    if (payload.action === "reject") {
      await tx.order.update({
        where: { id: orderId },
        data: {
          tailorId: session.user.id,
          currentStatus: "REJECTED_BY_TAILOR",
        },
      });
      await tx.orderStatus.create({
        data: {
          orderId,
          status: "REJECTED_BY_TAILOR",
          changedByUserId: session.user.id,
          note: payload.note,
        },
      });
      return { action: "reject" as const };
    }

    if (payload.action === "clarification") {
      await tx.order.update({
        where: { id: orderId },
        data: {
          tailorId: session.user.id,
          currentStatus: "CLARIFICATION_REQUESTED",
        },
      });
      await tx.orderStatus.create({
        data: {
          orderId,
          status: "CLARIFICATION_REQUESTED",
          changedByUserId: session.user.id,
          note: payload.note,
        },
      });
      return { action: "clarification" as const };
    }

    const quote = await tx.quote.upsert({
      where: { orderId },
      update: {
        tailorId: session.user.id,
        fabricCost: payload.fabricCost,
        stitchingCost: payload.stitchingCost,
        embroideryCost: payload.embroideryCost,
        deliveryCost: payload.deliveryCost,
        totalPrice: payload.totalPrice,
        estimatedDeliveryDays: payload.estimatedDeliveryDays,
        amount: payload.totalPrice,
        currency: payload.currency.toUpperCase(),
        status: "SENT",
        message: payload.message,
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
      },
      create: {
        orderId,
        tailorId: session.user.id,
        fabricCost: payload.fabricCost,
        stitchingCost: payload.stitchingCost,
        embroideryCost: payload.embroideryCost,
        deliveryCost: payload.deliveryCost,
        totalPrice: payload.totalPrice,
        estimatedDeliveryDays: payload.estimatedDeliveryDays,
        amount: payload.totalPrice,
        currency: payload.currency.toUpperCase(),
        status: "SENT",
        message: payload.message,
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        tailorId: session.user.id,
        currentStatus: "QUOTATION_SENT",
        progressStatus: "AWAITING_PAYMENT",
      },
    });

    await tx.orderStatus.create({
      data: {
        orderId,
        status: "QUOTATION_SENT",
        changedByUserId: session.user.id,
        note: payload.message ?? "Quotation sent.",
      },
    });

    await tx.orderProgressUpdate.create({
      data: {
        orderId,
        status: "AWAITING_PAYMENT",
        changedByUserId: session.user.id,
        note: "Quotation sent. Waiting for customer payment.",
      },
    });

    return { action: "quote" as const, quoteId: quote.id };
  });

  return NextResponse.json({ data: result }, { status: 200 });
}
