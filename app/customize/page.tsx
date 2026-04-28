"use client";

import { FormEvent, useEffect, useState } from "react";

type DraftOrder = {
  id: string;
  fabric: string;
  color: string;
  sleeveStyle: string;
  neckStyle: string;
  length: string;
  embroidery: string;
  notes: string | null;
  status: "DRAFT";
  createdAt: string;
};

type CustomizationFormState = {
  fabric: string;
  color: string;
  sleeveStyle: string;
  neckStyle: string;
  length: string;
  embroidery: string;
  notes: string;
};

const initialForm: CustomizationFormState = {
  fabric: "Cotton",
  color: "Black",
  sleeveStyle: "Full Sleeve",
  neckStyle: "Round Neck",
  length: "Regular",
  embroidery: "None",
  notes: "",
};

export default function CustomizePage() {
  const [form, setForm] = useState<CustomizationFormState>(initialForm);
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [message, setMessage] = useState("");
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDrafts() {
      try {
        const response = await fetch("/api/draft-orders", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setError("Could not load draft orders.");
          return;
        }

        const payload = (await response.json()) as { data: DraftOrder[] };
        setDraftOrders(payload.data);
      } catch {
        setError("Could not load draft orders.");
      } finally {
        setIsLoadingDrafts(false);
      }
    }

    loadDrafts();
  }, []);

  function updateField<K extends keyof CustomizationFormState>(
    key: K,
    value: CustomizationFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/draft-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as {
        data?: DraftOrder;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "Failed to save draft order.");
        return;
      }

      setDraftOrders((prev) => [payload.data as DraftOrder, ...prev]);
      setMessage("Draft Order saved.");
      setForm(initialForm);
    } catch {
      setError("Failed to save draft order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmitOrder() {
    setMessage("");
    setError("");
    setIsSubmittingOrder(true);

    try {
      const response = await fetch("/api/orders/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as {
        data?: { id: string };
        error?: string;
        redirectTo?: string;
      };

      if (response.status === 401) {
        window.location.href = "/login?callbackUrl=/customize";
        return;
      }

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "Failed to submit order.");
        return;
      }

      setMessage(
        "Order submitted successfully. Progress tracking started at PENDING_APPROVAL.",
      );
      setForm(initialForm);
    } catch {
      setError("Failed to submit order.");
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 md:py-14">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Costume Customization
        </p>
        <h1 className="mt-2 text-3xl font-bold">Create Your Design</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Select your preferences and save as a draft first.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Fabric</span>
            <select
              value={form.fabric}
              onChange={(e) => updateField("fabric", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option>Cotton</option>
              <option>Silk</option>
              <option>Linen</option>
              <option>Velvet</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Color</span>
            <input
              value={form.color}
              onChange={(e) => updateField("color", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="e.g. Black, Maroon, Navy"
              required
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Sleeve Style</span>
            <select
              value={form.sleeveStyle}
              onChange={(e) => updateField("sleeveStyle", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option>Full Sleeve</option>
              <option>Half Sleeve</option>
              <option>Sleeveless</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Neck Style</span>
            <select
              value={form.neckStyle}
              onChange={(e) => updateField("neckStyle", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option>Round Neck</option>
              <option>V Neck</option>
              <option>Collar Neck</option>
              <option>Boat Neck</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Length</span>
            <select
              value={form.length}
              onChange={(e) => updateField("length", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option>Regular</option>
              <option>Knee Length</option>
              <option>Floor Length</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Embroidery</span>
            <select
              value={form.embroidery}
              onChange={(e) => updateField("embroidery", e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option>None</option>
              <option>Light</option>
              <option>Medium</option>
              <option>Heavy</option>
            </select>
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span className="font-medium">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="min-h-28 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Add any custom instructions..."
            />
          </label>

          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting || isSubmittingOrder}
                className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isSubmitting ? "Saving..." : "Save as Draft Order"}
              </button>
              <button
                type="button"
                onClick={onSubmitOrder}
                disabled={isSubmitting || isSubmittingOrder}
                className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-semibold disabled:opacity-70 dark:border-zinc-700"
              >
                {isSubmittingOrder ? "Submitting..." : "Submit Order"}
              </button>
            </div>
            {message ? (
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                {message}
              </p>
            ) : null}
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Your Draft Orders</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Drafts are loaded from your backend and tied to your account.
        </p>

        <div className="mt-4 space-y-3">
          {isLoadingDrafts ? (
            <p className="text-sm text-zinc-500">Loading drafts...</p>
          ) : draftOrders.length === 0 ? (
            <p className="text-sm text-zinc-500">No draft orders yet.</p>
          ) : (
            draftOrders.map((draft) => (
              <div
                key={draft.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {draft.status === "DRAFT" ? "Draft Order" : draft.status}
                </p>
                <p className="mt-1 text-sm">
                  {draft.fabric} | {draft.color} | {draft.sleeveStyle} |{" "}
                  {draft.neckStyle} | {draft.length} | Embroidery:{" "}
                  {draft.embroidery}
                </p>
                {draft.notes ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Notes: {draft.notes}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
