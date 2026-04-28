import crypto from "crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
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
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order || order.customerId !== session.user.id || !order.payment) {
    return NextResponse.json(
      { error: "Order/payment not found." },
      { status: 404 },
    );
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Razorpay secret is not configured." },
      { status: 500 },
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "Signature verification failed." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: order.payment!.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        transactionRef: razorpay_payment_id,
        provider: "RAZORPAY",
        providerOrderId: razorpay_order_id,
      },
    });
    await tx.order.update({
      where: { id: orderId },
      data: {
        currentStatus: "PAID",
        progressStatus: "CONFIRMED",
      },
    });
    await tx.orderStatus.create({
      data: {
        orderId,
        status: "PAID",
        changedByUserId: session.user.id,
        note: "Payment successful via Razorpay.",
      },
    });
    await tx.orderProgressUpdate.create({
      data: {
        orderId,
        status: "CONFIRMED",
        changedByUserId: session.user.id,
        note: "Payment confirmed. Production can begin.",
      },
    });
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
