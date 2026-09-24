"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAdminChurchId } from "@/hooks/use-admin-church-id";
import { useSubscriptionQuery } from "@/hooks/use-subscription-query";
import { useOrganizationOptional } from "@/context/organization-context";
import type {
  PlanId,
  SubscriptionSnapshot,
  UsageLimitKey,
} from "@/types/subscription";
import {
  getLimitExceededMessage,
  getRecommendedPlanForLimit,
} from "@/lib/subscription/limits";
import { getPlan } from "@/lib/subscription/plans";
import {
  getTrialWriteUnavailableMessage,
  isProtectedTrialWrite,
  isTrialAccessExpired,
  type TrialWriteRequest,
} from "@/lib/subscription/trial-write";

type UpgradeModalState = {
  open: boolean;
  limitKey?: UsageLimitKey;
  message?: string;
  recommendedPlanId?: PlanId;
};

type ExpiredActionState = {
  open: boolean;
  message: string;
};

type SubscriptionContextValue = {
  organizationId: string | null;
  churchId: string | null;
  snapshot: SubscriptionSnapshot | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isTrialExpired: boolean;
  upgradeModal: UpgradeModalState;
  openUpgradeModal: (input: {
    limitKey: UsageLimitKey;
    message?: string;
  }) => void;
  closeUpgradeModal: () => void;
  checkUsageLimit: (limitKey: UsageLimitKey) => boolean;
  canUseFeature: (key: keyof SubscriptionSnapshot["features"]) => boolean;
  allowWrite: (request: TrialWriteRequest) => boolean;
  expiredAction: ExpiredActionState;
  closeExpiredAction: () => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const churchId = useAdminChurchId();
  const organization = useOrganizationOptional();
  const organizationId = organization?.organization?.id ?? null;
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>({
    open: false,
  });
  const [expiredAction, setExpiredAction] = useState<ExpiredActionState>({
    open: false,
    message: "",
  });

  const { data, error, refetch } = useSubscriptionQuery(organizationId);
  const organizationLoading = Boolean(organization?.loading);

  const openUpgradeModal = useCallback(
    (input: { limitKey: UsageLimitKey; message?: string }) => {
      const planId = data?.subscription.planId ?? "free";
      const usage = data?.usage[input.limitKey] ?? 0;
      const recommendedPlanId = getRecommendedPlanForLimit(
        planId,
        input.limitKey,
        usage
      );

      setUpgradeModal({
        open: true,
        limitKey: input.limitKey,
        message:
          input.message ??
          getLimitExceededMessage(
            input.limitKey,
            getPlan(planId).name
          ),
        recommendedPlanId,
      });
    },
    [data]
  );

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModal({ open: false });
  }, []);

  const checkUsageLimit = useCallback(
    (limitKey: UsageLimitKey): boolean => {
      if (!data) return true;
      if (isTrialAccessExpired(data.trial) && data.trial.access !== "paid") {
        const resource =
          limitKey === "songs" ? "song"
          : limitKey === "sermons" ? "sermon"
          : limitKey === "articles" ? "article"
          : limitKey === "events" ? "event"
          : limitKey === "shorts" ? "short"
          : limitKey === "prayerRequests" ? "prayer"
          : limitKey === "donationCampaigns" ? "donation"
          : limitKey === "churches" ? "church"
          : "content";
        setExpiredAction({
          open: true,
          message: getTrialWriteUnavailableMessage({
            action: "create",
            resource,
          }),
        });
        return false;
      }
      const check = data.usageChecks.find((item) => item.key === limitKey);
      if (!check?.atLimit) return true;
      openUpgradeModal({ limitKey });
      return false;
    },
    [data, openUpgradeModal]
  );

  const canUseFeature = useCallback(
    (key: keyof SubscriptionSnapshot["features"]): boolean => {
      if (!data) return false;
      return Boolean(data.features[key]);
    },
    [data]
  );

  const isTrialExpired = isTrialAccessExpired(data?.trial);

  const closeExpiredAction = useCallback(() => {
    setExpiredAction({ open: false, message: "" });
  }, []);

  const allowWrite = useCallback(
    (request: TrialWriteRequest): boolean => {
      if (!isProtectedTrialWrite(request)) return true;
      if (!organizationId) return true;
      if (!data) return true;
      if (data.trial.access === "paid") return true;
      if (!isTrialAccessExpired(data.trial)) return true;
      setExpiredAction({
        open: true,
        message: getTrialWriteUnavailableMessage(request),
      });
      return false;
    },
    [data, organizationId]
  );

  const value = useMemo(
    (): SubscriptionContextValue => ({
      organizationId,
      churchId,
      snapshot: data,
      loading:
        organizationLoading ||
        (Boolean(organizationId) && !data && !error),
      error: error instanceof Error ? error.message : null,
      refetch: () => {
        void refetch();
      },
      isTrialExpired,
      upgradeModal,
      openUpgradeModal,
      closeUpgradeModal,
      checkUsageLimit,
      canUseFeature,
      allowWrite,
      expiredAction,
      closeExpiredAction,
    }),
    [
      organizationId,
      churchId,
      data,
      error,
      organizationLoading,
      refetch,
      isTrialExpired,
      upgradeModal,
      openUpgradeModal,
      closeUpgradeModal,
      checkUsageLimit,
      canUseFeature,
      allowWrite,
      expiredAction,
      closeExpiredAction,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}

/** Safe hook for pages that may render outside admin context. */
export function useSubscriptionOptional() {
  return useContext(SubscriptionContext);
}

const allowWriteFallback = (_request: TrialWriteRequest) => true;

export function useAllowTrialWrite() {
  const context = useSubscriptionOptional();
  return context?.allowWrite ?? allowWriteFallback;
}
