import type { BookOrderRecord, BookRecord } from "@/types/book";
import type { UpsertBookInput } from "@/lib/books/validation";

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    /* ignore */
  }
  return `Request failed (${response.status}).`;
}

export async function fetchBooksCatalog(query?: string, type?: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (type && type !== "all") params.set("type", type);
  const response = await fetch(`/api/books?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { books: BookRecord[] };
}

export async function fetchManagedBooks(token: string, query?: string) {
  const params = new URLSearchParams({ manage: "1" });
  if (query) params.set("q", query);
  const response = await fetch(`/api/books?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as {
    books: BookRecord[];
    churches: Array<{ id: string; name: string }>;
    scopeKind: "org" | "church";
  };
}

export async function fetchBook(id: string) {
  const response = await fetch(`/api/books/${id}`, { credentials: "include" });
  const body = (await response.json()) as {
    book?: BookRecord;
    canManage?: boolean;
    hasDigitalEntitlement?: boolean;
    error?: string;
    code?: string;
  };
  if (!response.ok) {
    return {
      error: body.error ?? "Book not found.",
      code: body.code,
      status: response.status,
    };
  }
  return {
    book: body.book!,
    canManage: Boolean(body.canManage),
    hasDigitalEntitlement: Boolean(body.hasDigitalEntitlement),
  };
}

export async function saveBook(
  token: string,
  input: UpsertBookInput,
  bookId?: string
) {
  const response = await fetch(bookId ? `/api/books/${bookId}` : "/api/books", {
    method: bookId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { book: BookRecord };
}

export async function deleteManagedBook(token: string, bookId: string) {
  const response = await fetch(`/api/books/${bookId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function uploadBookCover(
  token: string,
  bookId: string,
  file: File
) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`/api/books/${bookId}/cover`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { url: string };
}

export async function uploadBookPdf(token: string, bookId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`/api/books/${bookId}/file`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function createPhysicalOrder(
  token: string,
  bookId: string,
  payload: unknown
) {
  const response = await fetch(`/api/books/${bookId}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { order: BookOrderRecord };
}

export async function fetchManagedOrders(token: string) {
  const response = await fetch("/api/book-orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { orders: BookOrderRecord[] };
}

export async function fetchManagedOrder(token: string, orderId: string) {
  const response = await fetch(`/api/book-orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { order: BookOrderRecord };
}

export async function updateOrderFulfillment(
  token: string,
  orderId: string,
  payload: unknown
) {
  const response = await fetch(`/api/book-orders/${orderId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { order: BookOrderRecord };
}
