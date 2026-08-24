export type PrayerRequestStatus = "pending" | "approved" | "rejected";

export type PrayerRequestCategory =
  | "general"
  | "health"
  | "family"
  | "finances"
  | "salvation"
  | "guidance"
  | "thanksgiving"
  | "other";

export type FirebasePrayerRequest = {
  id: string;
  churchId: string;
  userId?: string;
  name: string;
  email?: string;
  title: string;
  request: string;
  category?: PrayerRequestCategory;
  isAnonymous: boolean;
  shareWithCommunity: boolean;
  isAnswered: boolean;
  answeredAt?: number;
  status: PrayerRequestStatus;
  prayerCount: number;
  createdAt: number;
  updatedAt: number;
};

export type CreatePrayerRequestInput = {
  churchId: string;
  userId: string;
  name: string;
  email?: string;
  title: string;
  request: string;
  category: PrayerRequestCategory;
  isAnonymous: boolean;
  shareWithCommunity: boolean;
};

export type UpdatePrayerRequestInput = {
  status?: PrayerRequestStatus;
  prayerCount?: number;
  isAnswered?: boolean;
  answeredAt?: number;
};

export type FirebasePrayerIntercession = {
  id: string;
  requestId: string;
  userId: string;
  createdAt: number;
};
