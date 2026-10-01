import type { ReactNode } from "react";

export function HeritagePageIntro({
  churchName,
  eyebrow,
  title,
  description,
}: {
  churchName: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="max-w-3xl">
      <p className="heritage-eyebrow">{churchName}</p>
      <p className="mt-3 text-[0.8rem] font-semibold tracking-[0.14em] uppercase text-[var(--heritage-accent-ink)]">
        {eyebrow}
      </p>
      <h1 className="heritage-display mt-3 text-[length:var(--heritage-section)]">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-[var(--heritage-muted)]">{description}</p>
      ) : null}
    </header>
  );
}

export function HeritageContentFrame({
  churchName,
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  churchName: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="heritage-content-system mx-auto w-full min-w-0 max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <HeritagePageIntro
          churchName={churchName}
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        {action ? <div className="shrink-0 sm:pt-10">{action}</div> : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function HeritageDetailFrame({ children }: { children: ReactNode }) {
  return (
    <div className="heritage-content-system mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
