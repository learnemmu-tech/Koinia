export type ChurchSettings = {
  defaultLanguage?: string;
  showDonations?: boolean;
  showEvents?: boolean;
  showPrayerWall?: boolean;
};

export type FirebaseChurch = {
  id: string;
  /** Parent organization — required for new churches */
  organizationId?: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  /** Alias: coverImage in product spec */
  bannerUrl?: string;
  coverImage?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  pastorName?: string;
  establishedYear?: number;
  timezone?: string;
  currency?: string;
  denomination?: string;
  /** independent | multi_site | ministry | non_profit */
  churchType?: string;
  /** Default branch for content scoping */
  defaultBranchId?: string;
  settings?: ChurchSettings;
  /** Theme tokens — future-ready branding */
  primaryColor?: string;
  secondaryColor?: string;
  welcomeMessage?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type CreateChurchInput = {
  organizationId?: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  coverImage?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  pastorName?: string;
  establishedYear?: number;
  timezone?: string;
  currency?: string;
  denomination?: string;
  /** independent | multi_site | ministry | non_profit */
  churchType?: string;
  defaultBranchId?: string;
  settings?: ChurchSettings;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeMessage?: string;
  isActive?: boolean;
};

export type UpdateChurchInput = Partial<CreateChurchInput>;

export type ChurchRole = "member" | "admin";

/** @deprecated Use FirebaseMembership from @/types/membership */
export type ChurchMembership = {
  churchId: string;
  role: ChurchRole;
};
