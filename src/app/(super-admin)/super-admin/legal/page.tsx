import Link from "next/link";

import { requirePlatformSuperAdmin } from "@/lib/auth/require-platform-super-admin";
import { LEGAL_DRAFTS } from "@/legal/documents";
import { publishLegalDraftAction } from "@/lib/legal/publish-action";
import { listLegalVersions } from "@/lib/legal/repository";

export default async function SuperAdminLegalPage() {
  await requirePlatformSuperAdmin();
  const rows = await Promise.all(
    LEGAL_DRAFTS.map(async (draft) => ({
      draft,
      versions: await listLegalVersions(draft.slug).catch(() => []),
    }))
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Legal documents</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Authored copies stay pending legal review until you publish one. Publishing archives
          the previous published version and stores an immutable snapshot. Church administrators
          cannot open this page.
        </p>
      </header>
      {rows.map(({ draft, versions }) => (
        <section key={draft.slug} className="rounded-md border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-medium">{draft.title}</h2>
            <Link className="text-sm underline" href={`/super-admin/legal/${draft.slug}`}>
              Preview draft
            </Link>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            Authored status: {draft.reviewStatus}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {versions.length === 0 ? <li>No published or archived version.</li> : null}
            {versions.map((version) => (
              <li key={version.id}>
                {version.versionLabel} · {version.reviewStatus}
                {version.reviewStatus !== "draft" ? (
                  <>
                    {" "}
                    ·{" "}
                    <Link className="underline" href={`/legal/${draft.slug}/versions/${version.versionLabel}`}>
                      Open snapshot
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          <form action={publishLegalDraftAction} className="mt-4 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="slug" value={draft.slug} />
            <input name="versionLabel" required placeholder="Version label" className="rounded-md border px-2 py-1 text-sm" />
            <input name="approverName" required placeholder="Approver name" className="rounded-md border px-2 py-1 text-sm" />
            <input name="effectiveOn" type="date" className="rounded-md border px-2 py-1 text-sm" />
            <input name="confirmation" required placeholder="Type PUBLISH" className="rounded-md border px-2 py-1 text-sm" />
            <textarea name="changeSummary" required placeholder="Change summary" className="sm:col-span-2 rounded-md border px-2 py-1 text-sm" />
            <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
              Publish approved version
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
