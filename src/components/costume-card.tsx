import Link from "next/link";
import type { CostumeItem } from "@/data/costumes";

type CostumeCardProps = {
  costume: CostumeItem;
};

export function CostumeCard({ costume }: CostumeCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className={`h-44 w-full bg-gradient-to-br ${costume.imageGradient} p-4`}
        aria-hidden="true"
      >
        <div className="inline-flex rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-zinc-700">
          {costume.imageLabel}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {costume.category}
          </p>
          <h3 className="text-lg font-semibold">{costume.name}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Price Range: {costume.priceRange}
          </p>
        </div>

        <Link
          href="/customize"
          className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Customize
        </Link>
      </div>
    </article>
  );
}
