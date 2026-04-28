import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const submitOrderSchema = z.object({
  fabric: z.string().min(1),
  color: z.string().min(1),
  sleeveStyle: z.string().min(1),
  neckStyle: z.string().min(1),
  length: z.string().min(1),
  embroidery: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", redirectTo: "/login" },
      { status: 401 },
    );
  }

  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json(
      { error: "Only customers can submit orders." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const parsed = submitOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order submission payload." },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          customerId: session.user.id,
          title: `${input.fabric} ${input.color} Custom Outfit`,
          notes: input.notes,
          currentStatus: "PENDING_TAILOR_REVIEW",
          progressStatus: "PENDING_APPROVAL",
          customization: {
            create: {
              fabricType: input.fabric,
              color: input.color,
              style: `${input.sleeveStyle} | ${input.neckStyle} | ${input.length}`,
              embroideryText:
                input.embroidery === "None" ? null : input.embroidery,
              notes: input.notes,
            },
          },
        },
      });

      await tx.orderStatus.create({
        data: {
          orderId: createdOrder.id,
          status: "PENDING_TAILOR_REVIEW",
          changedByUserId: session.user.id,
          note: "Order submitted by customer for tailor review.",
        },
      });

      await tx.orderProgressUpdate.create({
        data: {
          orderId: createdOrder.id,
          status: "PENDING_APPROVAL",
          changedByUserId: session.user.id,
          note: "Order submitted and waiting for tailor approval.",
        },
      });

      return createdOrder;
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit order." },
      { status: 500 },
    );
  }
}
