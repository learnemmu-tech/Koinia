"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Church, Plus } from "lucide-react";

import { AddChurchModal } from "@/components/admin/add-church-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { adminSectionClass } from "@/lib/responsive-classes";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";

export function CreateFirstChurchCard() {
  const router = useRouter();
  const { authUser } = useFirebaseAuth();
  const { organization, branchesByChurch, refetch } = useOrganization();
  const [modalOpen, setModalOpen] = useState(false);

  const totalChurches = Object.values(branchesByChurch).flat().length;

  if (!organization || !isMultiChurchOrgWorkspace(organization)) {
    return null;
  }

  if (totalChurches > 0) {
    return null;
  }

  return (
    <>
      <Card className={`${adminSectionClass} border-primary/20 bg-primary/5`}>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Church className="size-6" />
            </div>
            <div className="space-y-1">
              <CardTitle className="font-heading text-xl">
                Welcome to {organization.name}
              </CardTitle>
              <CardDescription className="text-base">
                Your organization is ready. Create your first church to start
                managing content, members, and ministry tools.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Church
          </Button>
        </CardContent>
      </Card>

      {authUser ?
        <AddChurchModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={async () => {
            setModalOpen(false);
            await refetch();
            router.refresh();
          }}
          organizationId={organization.id}
          userId={authUser.uid}
          userEmail={authUser.email}
        />
      : null}
    </>
  );
}
