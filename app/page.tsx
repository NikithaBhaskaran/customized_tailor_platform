import Link from "next/link";
import { CostumeCard } from "@/components/costume-card";
import {
  getCatalogCategories,
  getCatalogCostumes,
} from "@/features/costumes/catalog-data";

export default async function Home() {
  const costumes = await getCatalogCostumes();
  const categories = await getCatalogCategories();
  const featured = costumes.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 p-8 text-white shadow-xl md:p-12">
        <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-fuchsia-300/20 blur-2xl" />
        <div className="relative max-w-3xl space-y-6">
          <p className="inline-flex rounded-full border border-white/25 px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-100">
            Bespoke Tailoring Platform
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Design Your Perfect Costume for Every Occasion
          </h1>
          <p className="max-w-2xl text-sm text-zinc-200 md:text-base">
            From festive wear to wedding couture, explore premium designs and
            customize each detail with expert tailors.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              Explore Catalog
            </Link>
            <Link
              href="/customize"
              className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Start Customizing
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Popular Categories</h2>
          <Link
            href="/catalog"
            className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {categories.map((category) => (
            <div
              key={category}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900"
            >
              {category}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Costumes</h2>
          <Link href="/catalog" className="text-sm font-medium underline">
            Browse catalog
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featured.map((costume) => (
            <CostumeCard key={costume.id} costume={costume} />
          ))}
        </div>
      </section>
    </main>
  );
}
