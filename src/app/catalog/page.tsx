import Link from "next/link";
import { CostumeCard } from "@/components/costume-card";
import {
  getCatalogCategories,
  getCatalogCostumes,
} from "@/features/costumes/catalog-data";

export default async function CatalogPage() {
  const costumes = await getCatalogCostumes();
  const categories = await getCatalogCategories();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Costume Catalog
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          Explore Modern and Traditional Designs
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          Choose a style, compare price ranges, and start your custom order with
          trusted tailors.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium dark:border-zinc-700"
            >
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {costumes.map((costume) => (
          <CostumeCard key={costume.id} costume={costume} />
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">Need a fully custom design?</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Create an account and send your measurements plus style preferences.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/customize"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Customize Now
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
