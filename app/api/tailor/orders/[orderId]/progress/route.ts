import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import {
  canAdvanceToStatus,
  ORDER_PROGRESS_STATUSES,
  type OrderProgressStatus,
} from "@/lib/order-progress";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  status: z.enum(ORDER_PROGRESS_STATUSES),
  note: z.string().trim().max(500).optional(),
});

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
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid progress payload." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      tailorId: true,
      progressStatus: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.tailorId && order.tailorId !== session.user.id) {
    return NextResponse.json({ error: "This order belongs to another tailor." }, { status: 403 });
  }

  const nextStatus = parsed.data.status as OrderProgressStatus;
  if (!canAdvanceToStatus(order.progressStatus as OrderProgressStatus, nextStatus)) {
    return NextResponse.json(
      { error: "Progress can only move forward one stage at a time." },
      { status: 400 },
    );
  }

  if (order.progressStatus === nextStatus) {
    return NextResponse.json(
      { error: "Order is already at that progress stage." },
      { status: 400 },
    );
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        tailorId: session.user.id,
        progressStatus: nextStatus,
      },
      select: {
        id: true,
        progressStatus: true,
      },
    });

    await tx.orderProgressUpdate.create({
      data: {
        orderId,
        status: nextStatus,
        changedByUserId: session.user.id,
        note: parsed.data.note,
      },
    });

    return updated;
  });

  return NextResponse.json({ data: updatedOrder }, { status: 200 });
}
