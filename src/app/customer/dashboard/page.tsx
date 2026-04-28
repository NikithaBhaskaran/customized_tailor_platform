import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/auth";
import { ProgressTracker } from "@/components/orders/progress-tracker";
import { ORDER_PROGRESS_LABELS } from "@/lib/order-progress";
import { prisma } from "@/lib/prisma";

function formatWorkflowStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function CustomerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "CUSTOMER") {
    redirect("/tailor/dashboard");
  }

  const orders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      tailor: { select: { name: true, email: true } },
      payment: { select: { status: true, amount: true, currency: true } },
      quote: {
        select: {
          totalPrice: true,
          currency: true,
          estimatedDeliveryDays: true,
        },
      },
      progressUpdates: {
        orderBy: { createdAt: "desc" },
        include: {
          changedBy: { select: { name: true, email: true } },
        },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const activeOrders = orders.filter(
    (order) =>
      order.progressStatus !== "DELIVERED" &&
      order.currentStatus !== "REJECTED_BY_TAILOR",
  );
  const quotedOrders = orders.filter((order) => order.quote);
  const readyOrders = orders.filter(
    (order) => order.progressStatus === "READY" || order.progressStatus === "DELIVERED",
  );

  return (
    <main className="premium-shell mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="premium-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8 fade-up">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top,rgba(200,95,49,0.18),transparent_58%)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.12),transparent_70%)]" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              Customer Dashboard
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-100">
              Track every order from quote to delivery
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-[15px] dark:text-zinc-400">
              Welcome, {session.user.name ?? session.user.email}. This dashboard
              brings your orders, current status, quote details, and production
              timeline into one clean view.
            </p>
          </div>

          <div className="relative flex flex-wrap gap-3 fade-up fade-up-delay-1">
            <Link
              href="/customize"
              className="inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 dark:bg-zinc-100 dark:text-zinc-950"
            >
              Create New Order
            </Link>
            <Link
              href="/customer/measurements"
              className="inline-flex rounded-full border border-zinc-300 bg-white/90 px-5 py-2.5 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-zinc-950"
            >
              Add Measurements
            </Link>
            <Link
              href="/customer/quotes"
              className="inline-flex rounded-full border border-zinc-300 bg-white/90 px-5 py-2.5 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-zinc-950"
            >
              Review Quotes
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-3">
          <div className="premium-card-strong rounded-[1.5rem] p-5 fade-up fade-up-delay-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              All Orders
            </p>
            <p className="mt-2 text-3xl font-bold">{orders.length}</p>
            <p className="mt-1 text-sm text-zinc-500">
              Every customization request you placed.
            </p>
          </div>
          <div className="premium-card-strong rounded-[1.5rem] p-5 fade-up fade-up-delay-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              In Progress
            </p>
            <p className="mt-2 text-3xl font-bold">{activeOrders.length}</p>
            <p className="mt-1 text-sm text-zinc-500">
              Orders still moving through approval or production.
            </p>
          </div>
          <div className="premium-card-strong rounded-[1.5rem] p-5 fade-up fade-up-delay-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Quotes / Ready
            </p>
            <p className="mt-2 text-3xl font-bold">
              {quotedOrders.length} / {readyOrders.length}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Quoted orders and garments ready or delivered.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5 fade-up fade-up-delay-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Your Orders</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            View all orders, see the latest status, open quote details, and follow the timeline.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="premium-card rounded-[2rem] p-10 text-center">
            <h3 className="text-lg font-semibold">No orders yet</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Start with a new customization request and your timeline will show up here.
            </p>
            <Link
              href="/customize"
              className="mt-5 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
            >
              Create Your First Order
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <article
              key={order.id}
              className="premium-card overflow-hidden rounded-[1.85rem] transition-transform duration-300 hover:-translate-y-1 fade-up"
            >
              <div className="border-b border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(247,245,239,0.92))] p-5 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(28,30,29,0.85),rgba(19,21,20,0.96))]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{order.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Tailor: {order.tailor?.name ?? "Awaiting assignment"} (
                      {order.tailor?.email ?? "N/A"})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
                      {order.currentStatus}
                    </span>
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                      {ORDER_PROGRESS_LABELS[order.progressStatus]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="space-y-3">
                  {order.currentStatus === "REJECTED_BY_TAILOR" ? (
                    <div className="rounded-[1.5rem] border border-red-200 bg-[linear-gradient(180deg,#fff1f1,#fff7f7)] p-4 dark:border-red-900/60 dark:bg-red-950/30">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600 dark:text-red-300">
                        Order Rejected
                      </p>
                      <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-200">
                        {formatWorkflowStatus(order.currentStatus)}
                      </p>
                      <p className="mt-2 text-sm text-red-700/90 dark:text-red-200/90">
                        {order.statusHistory[0]?.note ??
                          "The tailor rejected this order."}
                      </p>
                    </div>
                  ) : null}

                  {order.currentStatus === "CLARIFICATION_REQUESTED" ? (
                    <div className="rounded-[1.5rem] border border-amber-200 bg-[linear-gradient(180deg,#fff8eb,#fffdf7)] p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                        Clarification Requested
                      </p>
                      <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                        {order.statusHistory[0]?.note ??
                          "The tailor asked for more details before continuing."}
                      </p>
                    </div>
                  ) : null}

                  <div className="premium-card-strong rounded-[1.5rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Quote
                    </p>
                    {order.quote ? (
                      <>
                        <p className="mt-2 text-2xl font-bold">
                          {Number(order.quote.totalPrice).toFixed(2)}{" "}
                          {order.quote.currency}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Estimated in {order.quote.estimatedDeliveryDays} days
                        </p>
                        <Link
                          href="/customer/quotes"
                          className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]"
                        >
                          View quote actions
                        </Link>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-500">
                        The tailor has not sent a quote yet.
                      </p>
                    )}
                  </div>

                  <div className="premium-card-strong rounded-[1.5rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Payment
                    </p>
                    {order.payment ? (
                      <>
                        <p className="mt-2 text-lg font-semibold">
                          {order.payment.status}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {Number(order.payment.amount).toFixed(2)}{" "}
                          {order.payment.currency}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-500">
                        Payment has not started yet.
                      </p>
                    )}
                  </div>

                  <div className="premium-card-strong rounded-[1.5rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Order Info
                    </p>
                    <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Workflow: {formatWorkflowStatus(order.currentStatus)}
                    </p>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Created {order.createdAt.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Last update {order.updatedAt.toLocaleString()}
                    </p>
                  </div>
                </aside>

                <section className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold tracking-tight">Timeline View</h4>
                    <p className="mt-1 text-sm text-zinc-500">
                      Follow the order from approval to delivery with each recorded update.
                    </p>
                  </div>
                  <ProgressTracker
                    currentStatus={order.progressStatus}
                    updates={order.progressUpdates}
                  />
                </section>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
