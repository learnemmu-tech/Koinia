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
    <header className="heritage-page-intro max-w-3xl">
      <p className="heritage-eyebrow">{churchName}</p>
      <p className="mt-1.5 text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-[var(--heritage-accent-ink)]">
        {eyebrow}
      </p>
      <h1 className="heritage-display mt-2 text-[length:var(--heritage-section)]">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--heritage-muted)] sm:text-[0.95rem]">
          {description}
        </p>
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
    <section className="heritage-content-system mx-auto w-full min-w-0 max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <HeritagePageIntro
          churchName={churchName}
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function HeritageDetailFrame({ children }: { children: ReactNode }) {
  return (
    <div className="heritage-content-system mx-auto w-full min-w-0 max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      {children}
    </div>
  );
}
