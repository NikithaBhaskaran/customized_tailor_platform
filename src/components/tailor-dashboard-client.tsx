"use client";

import { useEffect, useState } from "react";
import TailorOrderCard, { type TailorOrder } from "@/components/tailor-order-card";

export default function TailorDashboardClient() {
  const [orders, setOrders] = useState<TailorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [globalMessage, setGlobalMessage] = useState("");
  const [actionLoadingOrderId, setActionLoadingOrderId] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tailor/orders", { cache: "no-store" });
      const payload = (await response.json()) as {
        data?: TailorOrder[];
        error?: string;
      };

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "Could not load orders.");
        return;
      }

      setOrders(payload.data);
    } catch {
      setError("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function postToOrder(
    orderId: string,
    route: "action" | "progress",
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setGlobalMessage("");
    setError("");
    setActionLoadingOrderId(orderId);

    try {
      const response = await fetch(`/api/tailor/orders/${orderId}/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Action failed.");
        return false;
      }

      setGlobalMessage(successMessage);
      await loadOrders();
      return true;
    } catch {
      setError("Action failed.");
      return false;
    } finally {
      setActionLoadingOrderId("");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-10">
      <h1 className="text-2xl font-bold">Tailor Dashboard</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Review incoming orders, send quotations, and keep customers updated as
        production moves forward.
      </p>

      {globalMessage ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {globalMessage}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-500">No orders available.</p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <TailorOrderCard
              key={order.id}
              order={order}
              isLoading={actionLoadingOrderId === order.id}
              onRunAction={(body) =>
                postToOrder(order.id, "action", body, "Order action completed.")
              }
              onUpdateProgress={(body) =>
                postToOrder(order.id, "progress", body, "Order progress updated.")
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
