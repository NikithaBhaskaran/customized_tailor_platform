type PageContainerProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function PageContainer({ title, subtitle, children }: PageContainerProps) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      </header>
      {children}
    </main>
  );
}
