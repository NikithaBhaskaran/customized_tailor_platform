import {
  getProgressStepIndex,
  ORDER_PROGRESS_LABELS,
  ORDER_PROGRESS_STATUSES,
  type OrderProgressStatus,
} from "@/lib/order-progress";

type ProgressUpdate = {
  id: string;
  status: OrderProgressStatus;
  note: string | null;
  createdAt: string | Date;
  changedBy?: {
    name: string | null;
    email: string | null;
  } | null;
};

type ProgressTrackerProps = {
  currentStatus: OrderProgressStatus;
  updates: ProgressUpdate[];
};

export function ProgressTracker({
  currentStatus,
  updates,
}: ProgressTrackerProps) {
  const activeStep = getProgressStepIndex(currentStatus);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ORDER_PROGRESS_STATUSES.map((status, index) => {
          const isComplete = index <= activeStep;
          const isCurrent = status === currentStatus;

          return (
            <div
              key={status}
              className={`rounded-3xl px-4 py-4 text-sm transition-all duration-300 ${
                isComplete
                  ? "premium-card border-emerald-200 bg-[linear-gradient(180deg,rgba(214,245,233,0.95),rgba(255,255,255,0.92))] text-emerald-950 dark:border-emerald-900/70 dark:bg-[linear-gradient(180deg,rgba(13,66,58,0.7),rgba(18,20,20,0.95))] dark:text-emerald-100"
                  : "premium-card text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                Step {index + 1}
              </p>
              <p className="mt-1 font-semibold">{ORDER_PROGRESS_LABELS[status]}</p>
              <p className="mt-1 text-xs opacity-80">
                {isCurrent ? "Current stage" : isComplete ? "Completed" : "Upcoming"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="premium-card rounded-[1.75rem] p-5">
        <h3 className="text-sm font-semibold">Progress Timeline</h3>
        <div className="mt-4 space-y-4">
          {updates.length === 0 ? (
            <p className="text-sm text-zinc-500">No progress updates yet.</p>
          ) : (
            updates.map((update, index) => (
              <div key={update.id} className="flex gap-3 fade-up">
                <div className="flex w-6 flex-col items-center">
                  <span className="mt-1 h-3 w-3 rounded-full bg-[var(--accent-2)] shadow-[0_0_0_6px_rgba(15,118,110,0.12)]" />
                  {index < updates.length - 1 ? (
                    <span className="mt-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  ) : null}
                </div>
                <div className="premium-card-strong flex-1 rounded-2xl px-4 py-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">
                      {ORDER_PROGRESS_LABELS[update.status]}
                    </p>
                    <p className="shrink-0 text-xs text-zinc-500">
                      {new Date(update.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {update.note ? (
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                      {update.note}
                    </p>
                  ) : null}
                  {update.changedBy ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      Updated by {update.changedBy.name ?? update.changedBy.email}
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
