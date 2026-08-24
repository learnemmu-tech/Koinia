"use client";

import React from "react";

import { ContentAuthDialogHost } from "@/components/auth/content-auth-dialog";

type ContentAuthDialogOptions = {
  redirectOnClose?: boolean;
};

type ContentAuthDialogContextType = {
  openDialog: (callbackPath: string, options?: ContentAuthDialogOptions) => void;
  closeDialog: () => void;
  isOpen: boolean;
  callbackPath: string;
  redirectOnClose: boolean;
};

const ContentAuthDialogContext =
  React.createContext<ContentAuthDialogContextType | null>(null);

export function ContentAuthDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [callbackPath, setCallbackPath] = React.useState("/");
  const [redirectOnClose, setRedirectOnClose] = React.useState(false);

  const openDialog = React.useCallback(
    (path: string, options?: ContentAuthDialogOptions) => {
      setCallbackPath(path);
      setRedirectOnClose(options?.redirectOnClose ?? false);
      setIsOpen(true);
    },
    []
  );

  const closeDialog = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = React.useMemo(
    () => ({
      openDialog,
      closeDialog,
      isOpen,
      callbackPath,
      redirectOnClose,
    }),
    [openDialog, closeDialog, isOpen, callbackPath, redirectOnClose]
  );

  return (
    <ContentAuthDialogContext.Provider value={value}>
      {children}
      <ContentAuthDialogHost />
    </ContentAuthDialogContext.Provider>
  );
}

export function useContentAuthDialog() {
  const context = React.useContext(ContentAuthDialogContext);
  if (!context) {
    throw new Error(
      "useContentAuthDialog must be used within ContentAuthDialogProvider"
    );
  }
  return context;
}
