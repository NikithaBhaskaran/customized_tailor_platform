"use client";

import { useCallback, useEffect, useState } from "react";

type QuoteOrder = {
  id: string;
  title: string;
  currentStatus: string;
  quote: {
    fabricCost: number;
    stitchingCost: number;
    embroideryCost: number;
    deliveryCost: number;
    totalPrice: number;
    estimatedDeliveryDays: number;
    currency: string;
    message: string | null;
    status: string;
  } | null;
  tailor: { name: string | null; email: string | null } | null;
  payment: { status: string } | null;
};

type QuoteOrderApiResponse = Omit<QuoteOrder, "quote"> & {
  quote:
    | {
        fabricCost: number | string;
        stitchingCost: number | string;
        embroideryCost: number | string;
        deliveryCost: number | string;
        totalPrice: number | string;
        estimatedDeliveryDays: number;
        currency: string;
        message: string | null;
        status: string;
      }
    | null;
};

function toAmount(value: number | string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatAmount(value: number | string) {
  return toAmount(value).toFixed(2);
}

function normalizeOrders(data: QuoteOrderApiResponse[]): QuoteOrder[] {
  return data.map((order) => ({
    ...order,
    quote: order.quote
      ? {
          ...order.quote,
          fabricCost: toAmount(order.quote.fabricCost),
          stitchingCost: toAmount(order.quote.stitchingCost),
          embroideryCost: toAmount(order.quote.embroideryCost),
          deliveryCost: toAmount(order.quote.deliveryCost),
          totalPrice: toAmount(order.quote.totalPrice),
        }
      : null,
  }));
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

export default function CustomerQuotesPage() {
  const [orders, setOrders] = useState<QuoteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [noteByOrder, setNoteByOrder] = useState<Record<string, string>>({});
  const [actionLoadingOrderId, setActionLoadingOrderId] = useState("");

  async function loadRazorpayScript() {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/customer/quotes", { cache: "no-store" });
      const payload = (await response.json()) as {
        data?: QuoteOrderApiResponse[];
        error?: string;
      };
      if (!response.ok || !payload.data) {
        setError(payload.error ?? "Could not load quotes.");
        return;
      }
      setOrders(normalizeOrders(payload.data));
    } catch {
      setError("Could not load quotes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  async function runAction(orderId: string, body: Record<string, unknown>) {
    setMessage("");
    setError("");
    setActionLoadingOrderId(orderId);
    try {
      const response = await fetch(`/api/customer/quotes/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Action failed.");
        return;
      }
      setMessage("Action completed.");
      await loadQuotes();
    } catch {
      setError("Action failed.");
    } finally {
      setActionLoadingOrderId("");
    }
  }

  async function payNow(orderId: string) {
    setMessage("");
    setError("");
    setActionLoadingOrderId(orderId);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Failed to load Razorpay checkout.");
        return;
      }

      const createResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const createPayload = (await createResponse.json()) as {
        data?: {
          razorpayOrderId: string;
          amount: number;
          currency: string;
          keyId: string;
          orderId: string;
        };
        error?: string;
      };

      if (!createResponse.ok || !createPayload.data) {
        setError(createPayload.error ?? "Could not create payment order.");
        return;
      }

      const rz = new window.Razorpay({
        key: createPayload.data.keyId,
        amount: createPayload.data.amount,
        currency: createPayload.data.currency,
        name: "Costume Customization Platform",
        description: "Order Payment",
        order_id: createPayload.data.razorpayOrderId,
        handler: async (response) => {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (!verifyResponse.ok) {
            setError("Payment verification failed.");
            return;
          }

          setMessage("Payment successful. Order is now confirmed for production.");
          await loadQuotes();
        },
        modal: {
          ondismiss: async () => {
            await fetch("/api/payments/failure", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId,
                reason: "Checkout dismissed by customer.",
              }),
            });
          },
        },
        theme: { color: "#18181b" },
      });

      rz.open();
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setActionLoadingOrderId("");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold">Quote Review</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Review tailor quotations and choose your next step.
      </p>

      {message ? (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
          {message}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading quotes...</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No quotes available yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{order.title}</h2>
                  <p className="text-xs text-zinc-500">
                    Tailor: {order.tailor?.name ?? "Assigned tailor"} (
                    {order.tailor?.email ?? "N/A"})
                  </p>
                </div>
                <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold dark:border-zinc-700">
                  {order.currentStatus}
                </span>
              </div>

              {order.quote ? (
                <div className="mt-4 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
                  <p>Fabric Cost: {formatAmount(order.quote.fabricCost)}</p>
                  <p>Stitching Cost: {formatAmount(order.quote.stitchingCost)}</p>
                  <p>Embroidery Cost: {formatAmount(order.quote.embroideryCost)}</p>
                  <p>Delivery Cost: {formatAmount(order.quote.deliveryCost)}</p>
                  <p className="mt-1 font-semibold">
                    Total Price: {formatAmount(order.quote.totalPrice)}{" "}
                    {order.quote.currency}
                  </p>
                  <p>
                    Estimated Delivery: {order.quote.estimatedDeliveryDays} days
                  </p>
                  {order.payment ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      Payment Stage: {order.payment.status}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 space-y-2">
                <textarea
                  value={noteByOrder[order.id] ?? ""}
                  onChange={(e) =>
                    setNoteByOrder((prev) => ({
                      ...prev,
                      [order.id]: e.target.value,
                    }))
                  }
                  placeholder="Optional note (required for reject/modification)"
                  className="min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => runAction(order.id, { action: "accept" })}
                    disabled={actionLoadingOrderId === order.id}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Accept Quote
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      runAction(order.id, {
                        action: "reject",
                        note: noteByOrder[order.id] ?? "Quote rejected by customer.",
                      })
                    }
                    disabled={actionLoadingOrderId === order.id}
                    className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600"
                  >
                    Reject Quote
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      runAction(order.id, {
                        action: "request_modification",
                        note:
                          noteByOrder[order.id] ??
                          "Please revise quotation and details.",
                      })
                    }
                    disabled={actionLoadingOrderId === order.id}
                    className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700"
                  >
                    Request Modification
                  </button>
                  {order.payment?.status === "PENDING" ? (
                    <button
                      type="button"
                      onClick={() => payNow(order.id)}
                      disabled={actionLoadingOrderId === order.id}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Pay Now
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
