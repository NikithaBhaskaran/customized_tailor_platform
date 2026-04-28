"use client";

import { FormEvent, useEffect, useState } from "react";

type OrderOption = {
  id: string;
  title: string;
  currentStatus: string;
  progressStatus: string;
};

type MeasurementFormState = {
  orderId: string;
  chest: string;
  waist: string;
  hip: string;
  shoulder: string;
  sleeveLength: string;
  height: string;
  referenceImage: string;
};

const initialForm: MeasurementFormState = {
  orderId: "",
  chest: "",
  waist: "",
  hip: "",
  shoulder: "",
  sleeveLength: "",
  height: "",
  referenceImage: "",
};

const measurementFields: Array<{
  key: keyof Pick<
    MeasurementFormState,
    "chest" | "waist" | "hip" | "shoulder" | "sleeveLength" | "height"
  >;
  label: string;
}> = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hip", label: "Hip" },
  { key: "shoulder", label: "Shoulder" },
  { key: "sleeveLength", label: "Sleeve Length" },
  { key: "height", label: "Height" },
];

export default function CustomerMeasurementsPage() {
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [form, setForm] = useState<MeasurementFormState>(initialForm);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders/my", { cache: "no-store" });
        const payload = (await response.json()) as {
          data?: OrderOption[];
          error?: string;
        };

        if (!response.ok || !payload.data) {
          setError(payload.error ?? "Could not load orders.");
          return;
        }

        setOrders(payload.data);
        if (payload.data.length > 0) {
          setForm((prev) => ({ ...prev, orderId: payload.data![0].id }));
        }
      } catch {
        setError("Could not load orders.");
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
  }, []);

  function updateField<K extends keyof MeasurementFormState>(
    key: K,
    value: MeasurementFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onUploadImage(file: File | undefined) {
    if (!file) {
      updateField("referenceImage", "");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("referenceImage", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(form.orderId)}/measurements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chest: Number(form.chest),
            waist: Number(form.waist),
            hip: Number(form.hip),
            shoulder: Number(form.shoulder),
            sleeveLength: Number(form.sleeveLength),
            height: Number(form.height),
            referenceImage: form.referenceImage || undefined,
          }),
        },
      );

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Failed to submit measurements.");
        return;
      }

      setMessage(
        "Measurements added successfully. Approval and payment progress tracking stays active on your dashboard.",
      );
      setForm((prev) => ({
        ...initialForm,
        orderId: prev.orderId,
      }));
    } catch {
      setError("Failed to submit measurements.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-bold">Add Measurements</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Submit measurements for an order. We will attach them to the selected
          order and update the status.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm md:col-span-2">
            <span className="font-medium">Order</span>
            <select
              value={form.orderId}
              onChange={(e) => updateField("orderId", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              disabled={loadingOrders || orders.length === 0}
              required
            >
              {orders.length === 0 ? (
                <option value="">No orders available</option>
              ) : (
                orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.title} ({order.currentStatus} | {order.progressStatus})
                  </option>
                ))
              )}
            </select>
          </label>

          {measurementFields.map((field) => (
            <label key={field.key} className="space-y-2 text-sm">
              <span className="font-medium">{field.label}</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={form[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                required
              />
            </label>
          ))}

          <label className="space-y-2 text-sm md:col-span-2">
            <span className="font-medium">Optional Reference Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onUploadImage(e.target.files?.[0])}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting || !form.orderId}
              className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {submitting ? "Submitting..." : "Submit Measurements"}
            </button>
            {message ? (
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                {message}
              </p>
            ) : null}
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </section>
    </main>
  );
}
