"use client";

import Image from "next/image";
import { useState } from "react";
import { ProgressTracker } from "@/components/orders/progress-tracker";
import {
  ORDER_PROGRESS_LABELS,
  TAILOR_PROGRESS_STATUSES,
  type OrderProgressStatus,
} from "@/lib/order-progress";

export type TailorOrder = {
  id: string;
  title: string;
  currentStatus: string;
  progressStatus: OrderProgressStatus;
  notes: string | null;
  customer: { name: string | null; email: string | null };
  customization: {
    fabricType: string | null;
    color: string | null;
    style: string | null;
    embroideryText: string | null;
    notes: string | null;
  } | null;
  measurement: {
    chest: number | null;
    waist: number | null;
    hip: number | null;
    shoulder: number | null;
    sleeveLength: number | null;
    height: number | null;
    referenceImage: string | null;
  } | null;
  quote: {
    fabricCost: number;
    stitchingCost: number;
    embroideryCost: number;
    deliveryCost: number;
    totalPrice: number;
    estimatedDeliveryDays: number;
    currency: string;
    message: string | null;
  } | null;
  progressUpdates: Array<{
    id: string;
    status: OrderProgressStatus;
    note: string | null;
    createdAt: string;
    changedBy: { id: string; name: string | null; email: string | null } | null;
  }>;
};

type QuoteDraft = {
  fabricCost: string;
  stitchingCost: string;
  embroideryCost: string;
  deliveryCost: string;
  estimatedDeliveryDays: string;
  currency: string;
  message: string;
};

const EMPTY_QUOTE: QuoteDraft = {
  fabricCost: "",
  stitchingCost: "",
  embroideryCost: "",
  deliveryCost: "",
  estimatedDeliveryDays: "",
  currency: "USD",
  message: "",
};

type TailorOrderCardProps = {
  order: TailorOrder;
  isLoading: boolean;
  onRunAction: (body: Record<string, unknown>) => Promise<boolean>;
  onUpdateProgress: (body: Record<string, unknown>) => Promise<boolean>;
};

export default function TailorOrderCard({
  order,
  isLoading,
  onRunAction,
  onUpdateProgress,
}: TailorOrderCardProps) {
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<QuoteDraft>(EMPTY_QUOTE);
  const [progressStatus, setProgressStatus] = useState<OrderProgressStatus>(
    order.progressStatus === "PENDING_APPROVAL" ||
      order.progressStatus === "AWAITING_PAYMENT"
      ? "CONFIRMED"
      : order.progressStatus,
  );
  const [progressNote, setProgressNote] = useState("");

  function updateQuoteField(key: keyof QuoteDraft, value: string) {
    setQuote((prev) => ({ ...prev, [key]: value }));
  }

  const totalPrice =
    Number(quote.fabricCost || 0) +
    Number(quote.stitchingCost || 0) +
    Number(quote.embroideryCost || 0) +
    Number(quote.deliveryCost || 0);

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{order.title}</h2>
          <p className="text-xs text-zinc-500">
            {order.customer.name ?? "Customer"} ({order.customer.email})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold dark:border-zinc-700">
            Workflow: {order.currentStatus}
          </span>
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            Progress: {ORDER_PROGRESS_LABELS[order.progressStatus]}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold">Customization</h3>
          {order.customization ? (
            <div className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <p>Fabric: {order.customization.fabricType ?? "-"}</p>
              <p>Color: {order.customization.color ?? "-"}</p>
              <p>Style: {order.customization.style ?? "-"}</p>
              <p>Embroidery: {order.customization.embroideryText ?? "None"}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No customization added.</p>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold">Measurements</h3>
          {order.measurement ? (
            <div className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                Chest/Waist/Hip: {order.measurement.chest ?? "-"} /{" "}
                {order.measurement.waist ?? "-"} / {order.measurement.hip ?? "-"}
              </p>
              <p>
                Shoulder/Sleeve/Height: {order.measurement.shoulder ?? "-"} /{" "}
                {order.measurement.sleeveLength ?? "-"} /{" "}
                {order.measurement.height ?? "-"}
              </p>
              {order.measurement.referenceImage ? (
                <Image
                  src={order.measurement.referenceImage}
                  alt="Measurement reference"
                  width={144}
                  height={144}
                  unoptimized
                  className="mt-2 h-36 w-36 rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
                />
              ) : (
                <p>No image uploaded.</p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              Measurements not submitted.
            </p>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add reason or clarification note"
            className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="button"
            onClick={() =>
              onRunAction({
                action: "clarification",
                note: note || "Please clarify requirements.",
              })
            }
            disabled={isLoading}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"
          >
            Request Clarification
          </button>
          <button
            type="button"
            onClick={() =>
              onRunAction({
                action: "reject",
                note: note || "Order rejected by tailor.",
              })
            }
            disabled={isLoading}
            className="w-full rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-600"
          >
            Reject Order
          </button>
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input type="number" min="0" step="0.01" placeholder="Fabric cost" value={quote.fabricCost} onChange={(e) => updateQuoteField("fabricCost", e.target.value)} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <input type="number" min="0" step="0.01" placeholder="Stitching cost" value={quote.stitchingCost} onChange={(e) => updateQuoteField("stitchingCost", e.target.value)} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <input type="number" min="0" step="0.01" placeholder="Embroidery cost" value={quote.embroideryCost} onChange={(e) => updateQuoteField("embroideryCost", e.target.value)} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <input type="number" min="0" step="0.01" placeholder="Delivery cost" value={quote.deliveryCost} onChange={(e) => updateQuoteField("deliveryCost", e.target.value)} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <input type="number" min="1" step="1" placeholder="Estimated delivery days" value={quote.estimatedDeliveryDays} onChange={(e) => updateQuoteField("estimatedDeliveryDays", e.target.value)} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <input type="text" placeholder="Currency (USD)" maxLength={3} value={quote.currency} onChange={(e) => updateQuoteField("currency", e.target.value.toUpperCase())} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total Price (auto): {totalPrice.toFixed(2)} {quote.currency}
          </p>
          <textarea
            placeholder="Quotation message"
            value={quote.message}
            onChange={(e) => updateQuoteField("message", e.target.value)}
            className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="button"
            onClick={() =>
              onRunAction({
                action: "quote",
                fabricCost: Number(quote.fabricCost || 0),
                stitchingCost: Number(quote.stitchingCost || 0),
                embroideryCost: Number(quote.embroideryCost || 0),
                deliveryCost: Number(quote.deliveryCost || 0),
                totalPrice,
                estimatedDeliveryDays: Number(quote.estimatedDeliveryDays || 0),
                currency: quote.currency,
                message: quote.message,
              })
            }
            disabled={isLoading}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Send Quotation
          </button>
        </div>
      </div>

      <section className="mt-5 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Production Updates</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Move the order forward one stage at a time after payment is confirmed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={progressStatus}
              onChange={(e) => setProgressStatus(e.target.value as OrderProgressStatus)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {TAILOR_PROGRESS_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_PROGRESS_LABELS[status]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                onUpdateProgress({
                  status: progressStatus,
                  note: progressNote,
                })
              }
              disabled={
                isLoading ||
                order.progressStatus === "PENDING_APPROVAL" ||
                order.progressStatus === "AWAITING_PAYMENT"
              }
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Update Progress
            </button>
          </div>
        </div>
        <textarea
          value={progressNote}
          onChange={(e) => setProgressNote(e.target.value)}
          placeholder="Optional update note for the customer"
          className="mt-3 min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {(order.progressStatus === "PENDING_APPROVAL" ||
          order.progressStatus === "AWAITING_PAYMENT") && (
          <p className="mt-2 text-xs text-zinc-500">
            Production updates unlock after the order is paid and moved to confirmed.
          </p>
        )}
        <div className="mt-4">
          <ProgressTracker
            currentStatus={order.progressStatus}
            updates={order.progressUpdates}
          />
        </div>
      </section>
    </article>
  );
}
