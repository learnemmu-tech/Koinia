import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { listPublishedCatalogBooks } from "@/lib/postgres/books";
import { HeritageBooksPage } from "@/templates/heritage/pages/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateChurchWebsiteMetadata(slug, "Books");
}

export default async function ChurchBooksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model } = await requireChurchWebsite(slug);
  const books = await listPublishedCatalogBooks({
    churchId: model.church.id,
    includeMembersOnlyForChurchIds: model.viewer.isMember
      ? [model.church.id]
      : undefined,
  });

  if (model.templateId === "heritage") {
    return <HeritageBooksPage model={model} books={books} />;
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-heading text-4xl">Books</h1>
      <ul className="mt-8 space-y-3">
        {books.map((book) => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>
    </section>
  );
}
