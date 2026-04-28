import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";

const payloadSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { payment: true },
  });

  if (!order || order.customerId !== session.user.id || !order.payment) {
    return NextResponse.json(
      { error: "Order/payment not found." },
      { status: 404 },
    );
  }

  const amountInPaise = Math.round(Number(order.payment.amount) * 100);
  if (!amountInPaise || amountInPaise <= 0) {
    return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
  }

  const razorpay = getRazorpayClient();
  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: order.payment.currency,
    receipt: `order_${order.id.slice(0, 16)}`,
  });

  await prisma.payment.update({
    where: { id: order.payment.id },
    data: {
      provider: "RAZORPAY",
      providerOrderId: razorpayOrder.id,
      status: "PENDING",
    },
  });

  return NextResponse.json(
    {
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
      },
    },
    { status: 200 },
  );
}
