import type {
  BookDigitalAccessMode,
  BookOrderFulfillmentStatus,
  BookOrderPaymentStatus,
  BookStatus,
  BookType,
  BookVisibility,
} from "@/db/schema/enums";

export type {
  BookDigitalAccessMode,
  BookOrderFulfillmentStatus,
  BookOrderPaymentStatus,
  BookStatus,
  BookType,
  BookVisibility,
};

export type BookDigitalEdition = {
  id: string;
  bookId: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  pageCount: number | null;
  hasFile: boolean;
  accessMode: BookDigitalAccessMode;
  priceCents: number;
  currency: string;
};

export type BookPhysicalEdition = {
  id: string;
  bookId: string;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  sku: string | null;
  weightGrams: number | null;
  shippingAvailable: boolean;
  isActive: boolean;
};

export type BookRecord = {
  id: string;
  organizationId: string;
  churchId: string;
  title: string;
  slug: string;
  authorName: string;
  description: string;
  coverImageUrl: string | null;
  status: BookStatus;
  visibility: BookVisibility;
  bookType: BookType;
  language: string;
  currency: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  churchName: string;
  organizationName: string;
  digital: BookDigitalEdition | null;
  physical: BookPhysicalEdition | null;
};

export type BookOrderRecord = {
  id: string;
  organizationId: string;
  churchId: string;
  bookId: string;
  bookTitle: string;
  buyerUserId: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  orderNumber: string;
  quantity: number;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  paymentStatus: BookOrderPaymentStatus;
  fulfillmentStatus: BookOrderFulfillmentStatus;
  shippingName: string;
  shippingPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
