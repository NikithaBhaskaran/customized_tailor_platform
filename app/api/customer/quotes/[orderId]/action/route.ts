import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("reject"), note: z.string().min(2) }),
  z.object({
    action: z.literal("request_modification"),
    note: z.string().min(2),
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
  if (session.user.role !== "CUSTOMER") {
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
    include: { quote: true },
  });
  if (!order || order.customerId !== session.user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!order.quote) {
    return NextResponse.json({ error: "No quote found for this order." }, { status: 400 });
  }

  const payload = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (payload.action === "accept") {
      await tx.quote.update({
        where: { orderId },
        data: { status: "ACCEPTED" },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          currentStatus: "QUOTE_ACCEPTED",
          progressStatus: "AWAITING_PAYMENT",
        },
      });
      await tx.orderStatus.create({
        data: {
          orderId,
          status: "QUOTE_ACCEPTED",
          changedByUserId: session.user.id,
          note: "Quote accepted. Moved to payment stage.",
        },
      });
      await tx.payment.upsert({
        where: { orderId },
        update: {
          quoteId: order.quote!.id,
          amount: order.quote!.totalPrice,
          currency: order.quote!.currency,
          status: "PENDING",
        },
        create: {
          orderId,
          quoteId: order.quote!.id,
          amount: order.quote!.totalPrice,
          currency: order.quote!.currency,
          status: "PENDING",
        },
      });
      await tx.orderProgressUpdate.create({
        data: {
          orderId,
          status: "AWAITING_PAYMENT",
          changedByUserId: session.user.id,
          note: "Quote accepted. Waiting for payment confirmation.",
        },
      });
      return;
    }

    if (payload.action === "reject") {
      await tx.quote.update({
        where: { orderId },
        data: { status: "REJECTED", message: payload.note },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { currentStatus: "QUOTE_REJECTED" },
      });
      await tx.orderStatus.create({
        data: {
          orderId,
          status: "QUOTE_REJECTED",
          changedByUserId: session.user.id,
          note: payload.note,
        },
      });
      return;
    }

    await tx.order.update({
      where: { id: orderId },
      data: { currentStatus: "QUOTE_MODIFICATION_REQUESTED" },
    });
    await tx.orderStatus.create({
      data: {
        orderId,
        status: "QUOTE_MODIFICATION_REQUESTED",
        changedByUserId: session.user.id,
        note: payload.note,
      },
    });
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
