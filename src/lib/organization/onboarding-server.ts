import "server-only";

import type { WorkspaceType } from "@/types/organization";

export type FirstChurchOnboardingInput = {
  name: string;
  country: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  workspaceType: WorkspaceType;
  logoUrl?: string;
  timezone?: string;
  defaultLanguage?: string;
  denomination?: string;
  churchType?: string;
};
