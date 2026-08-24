"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { firebaseAuth } from "@/lib/firebase-auth-service";

type InviteChurchAdminDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  churchId: string;
  branchId: string;
  churchName: string;
};

export function InviteChurchAdminDialog({
  open,
  onOpenChange,
  organizationId,
  churchId,
  branchId,
  churchName,
}: InviteChurchAdminDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter an email address");
      return;
    }

    const user = firebaseAuth.currentUser;
    if (!user) {
      toast.error("Please sign in to send invitations");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          churchId,
          branchId,
          role: "church_admin",
          email: trimmed,
          deliveryMethod: "email",
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to send invitation");
      }

      toast.success(body.message ?? `Invitation sent to ${trimmed}`);
      setEmail("");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a church admin?</DialogTitle>
          <DialogDescription>
            {churchName} was created successfully. Invite someone to manage this
            church — they will only have access to {churchName}, not your entire
            organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-admin-email">Admin email</Label>
            <Input
              id="invite-admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourchurch.org"
              disabled={loading}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Skip for now
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ?
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending…
                </>
              : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
