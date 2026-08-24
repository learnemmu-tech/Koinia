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
import { useFirebaseAuth } from "@/context/firebase-auth-context";
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

type UpgradeModalState = {
  open: boolean;
  limitKey?: UsageLimitKey;
  message?: string;
  recommendedPlanId?: PlanId;
};

type SubscriptionContextValue = {
  organizationId: string | null;
  churchId: string | null;
  snapshot: SubscriptionSnapshot | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  upgradeModal: UpgradeModalState;
  openUpgradeModal: (input: {
    limitKey: UsageLimitKey;
    message?: string;
  }) => void;
  closeUpgradeModal: () => void;
  checkUsageLimit: (limitKey: UsageLimitKey) => boolean;
  canUseFeature: (key: keyof SubscriptionSnapshot["features"]) => boolean;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { authUser } = useFirebaseAuth();
  const churchId = useAdminChurchId();
  const organization = useOrganizationOptional();
  const organizationId = organization?.organization?.id ?? null;
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>({
    open: false,
  });

  const enabled = Boolean(authUser && organizationId);

  const { data, isLoading, error, refetch } = useSubscriptionQuery(organizationId);

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
      const check = data.usageChecks.find((item) => item.key === limitKey);
      if (!check?.atLimit) return true;
      openUpgradeModal({ limitKey });
      return false;
    },
    [data, openUpgradeModal]
  );

  const canUseFeature = useCallback(
    (key: keyof SubscriptionSnapshot["features"]): boolean => {
      if (!data) return true;
      return Boolean(data.features[key]);
    },
    [data]
  );

  const value = useMemo(
    (): SubscriptionContextValue => ({
      organizationId,
      churchId,
      snapshot: data,
      loading: enabled && isLoading,
      error: error instanceof Error ? error.message : null,
      refetch: () => {
        void refetch();
      },
      upgradeModal,
      openUpgradeModal,
      closeUpgradeModal,
      checkUsageLimit,
      canUseFeature,
    }),
    [
      organizationId,
      churchId,
      data,
      enabled,
      isLoading,
      error,
      refetch,
      upgradeModal,
      openUpgradeModal,
      closeUpgradeModal,
      checkUsageLimit,
      canUseFeature,
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
