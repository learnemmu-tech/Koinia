"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  useAllowTrialWrite,
  useSubscriptionOptional,
} from "@/context/subscription-context";
import type { TrialWriteRequest } from "@/lib/subscription/trial-write";

/** Close a create/edit surface if the current org is expired, before paint. */
export function useTrialWriteMountGuard(
  request: TrialWriteRequest,
  open: boolean,
  onBlocked: () => void
): boolean {
  const allowWrite = useAllowTrialWrite();
  const [blocked, setBlocked] = useState(false);
  const onBlockedRef = useRef(onBlocked);
  const requestRef = useRef(request);

  useLayoutEffect(() => {
    onBlockedRef.current = onBlocked;
    requestRef.current = request;
  }, [onBlocked, request]);

  useLayoutEffect(() => {
    if (!open) {
      setBlocked(false);
      return;
    }
    if (allowWrite(requestRef.current)) {
      setBlocked(false);
      return;
    }
    setBlocked(true);
    onBlockedRef.current();
  }, [open, allowWrite, request.action, request.resource, request.contentScope]);

  return blocked;
}

export function TrialWriteRouteGuard({
  request,
  fallbackHref,
  children,
}: {
  request: TrialWriteRequest;
  fallbackHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const allowWrite = useAllowTrialWrite();
  const subscription = useSubscriptionOptional();
  const loading = Boolean(subscription?.loading);
  const [allowed, setAllowed] = useState(!loading);
  const requestRef = useRef(request);

  useLayoutEffect(() => {
    requestRef.current = request;
  }, [request]);

  useLayoutEffect(() => {
    if (loading) return;
    const ok = allowWrite(requestRef.current);
    setAllowed(ok);
    if (!ok) router.replace(fallbackHref);
  }, [
    loading,
    allowWrite,
    fallbackHref,
    router,
    request.action,
    request.resource,
    request.contentScope,
  ]);

  if (loading || !allowed) return null;
  return children;
}
