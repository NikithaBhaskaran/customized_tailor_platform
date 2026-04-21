import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
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

  await prisma.payment.update({
    where: { id: order.payment.id },
    data: {
      status: "FAILED",
      transactionRef: parsed.data.razorpayPaymentId,
    },
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
