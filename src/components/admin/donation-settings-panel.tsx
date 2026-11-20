"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminChurchId } from "@/hooks/use-admin-church-id";
import {
  acceptDonationDeclaration,
  loadChurchDonationSettings,
  loadDonationQrPreview,
  saveReceivingMethod,
  uploadDonationQr,
} from "@/lib/donations/church-receiving-actions";

export function DonationSettingsPanel() {
  const churchId = useAdminChurchId();
  const [declared, setDeclared] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [holder, setHolder] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [branch, setBranch] = useState("");
  const [masked, setMasked] = useState("");
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!churchId) return;
    void loadChurchDonationSettings(churchId).then((settings) => {
      setDeclared(settings.authorizedDeclaration);
      const upi = settings.methods.find((method) => method.method === "upi_id");
      const bankMethod = settings.methods.find((method) => method.method === "bank_transfer");
      if (upi) {
        setDisplayName(upi.displayName);
        setUpiId(upi.upiId);
        setInstructions(upi.instructions);
      }
      if (bankMethod) {
        setHolder(bankMethod.accountHolderName);
        setBank(bankMethod.bankName);
        setIfsc(bankMethod.ifscCode);
        setBranch(bankMethod.branchName);
        setMasked(bankMethod.accountNumberMasked);
      }
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Could not load donation settings.");
    });
    void loadDonationQrPreview(churchId).then((preview) => setQrPreview(preview?.url ?? null));
  }, [churchId]);

  async function declare() {
    if (!churchId) return;
    setBusy(true);
    try {
      await acceptDonationDeclaration(churchId);
      setDeclared(true);
      toast.success("Declaration saved. This is not a legal or bank verification.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the declaration.");
    } finally {
      setBusy(false);
    }
  }

  async function saveUpi() {
    if (!churchId) return;
    setBusy(true);
    try {
      await saveReceivingMethod({
        churchId,
        method: "upi_id",
        enabled: true,
        displayName: displayName || "Church UPI",
        instructions,
        upiId,
      });
      toast.success("UPI ID saved. Format validation does not prove the account belongs to the church.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the UPI ID.");
    } finally {
      setBusy(false);
    }
  }

  async function saveBank() {
    if (!churchId) return;
    if (!window.confirm("Save these bank details for donors? They are stored encrypted and are not legally verified.")) return;
    setBusy(true);
    try {
      await saveReceivingMethod({
        churchId,
        method: "bank_transfer",
        enabled: true,
        displayName: holder || "Church bank account",
        accountHolderName: holder,
        bankName: bank,
        accountNumber: account || undefined,
        ifscCode: ifsc,
        branchName: branch,
        instructions,
      });
      setAccount("");
      toast.success("Bank details saved as a church declaration, not a verified account.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save bank details.");
    } finally {
      setBusy(false);
    }
  }

  async function saveQr() {
    if (!churchId || !file) return;
    setBusy(true);
    try {
      const data = new FormData();
      data.set("churchId", churchId);
      data.set("file", file);
      await uploadDonationQr(data);
      const preview = await loadDonationQrPreview(churchId);
      setQrPreview(preview?.url ?? null);
      toast.success("QR image stored privately.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload the QR image.");
    } finally {
      setBusy(false);
    }
  }

  if (!churchId) {
    return <p className="text-sm text-muted-foreground">Select a church to configure donations.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>India donations</CardTitle>
          <CardDescription>
            Donations are paid to this church. Koinia does not collect, hold, or settle them. Currency is INR. Foreign donations stay disabled. Tax deductions and 80G are not advertised.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={declared} onChange={(event) => setDeclared(event.target.checked)} />
            <span>This church declares it is authorized to receive these donations into the accounts it configures. Entering a UPI ID or bank account does not verify ownership.</span>
          </label>
          <Button type="button" disabled={busy || !declared} onClick={() => void declare()}>Save declaration</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UPI QR</CardTitle>
          <CardDescription>Upload the church&apos;s existing QR. JPEG, PNG, or WebP, up to 2 MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {qrPreview ? <img src={qrPreview} alt="Current church UPI QR" className="h-40 w-40 rounded-md border" /> : null}
          {file ? <p className="text-sm text-muted-foreground">Selected: {file.name}</p> : null}
          <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <Button type="button" disabled={busy || !file} onClick={() => void saveQr()}>Save QR</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UPI ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="upi-name">Display name</Label>
          <Input id="upi-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <Label htmlFor="upi-id">UPI ID</Label>
          <Input id="upi-id" value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="church@upi" />
          <Label htmlFor="upi-notes">Instructions</Label>
          <Textarea id="upi-notes" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
          <Button type="button" disabled={busy} onClick={() => void saveUpi()}>Save UPI ID</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank transfer</CardTitle>
          <CardDescription>
            {masked ? `Current account ${masked}. ` : ""}
            Full numbers are encrypted. This status stays declared until a bank or counsel confirms it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="holder">Account holder</Label>
          <Input id="holder" value={holder} onChange={(event) => setHolder(event.target.value)} />
          <Label htmlFor="bank">Bank name</Label>
          <Input id="bank" value={bank} onChange={(event) => setBank(event.target.value)} />
          <Label htmlFor="account">Account number</Label>
          <Input id="account" value={account} onChange={(event) => setAccount(event.target.value)} autoComplete="off" />
          <Label htmlFor="ifsc">IFSC</Label>
          <Input id="ifsc" value={ifsc} onChange={(event) => setIfsc(event.target.value)} />
          <Label htmlFor="branch">Branch</Label>
          <Input id="branch" value={branch} onChange={(event) => setBranch(event.target.value)} />
          <Button type="button" disabled={busy} onClick={() => void saveBank()}>Save bank details</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment gateway</CardTitle>
          <CardDescription>Not available for church donations.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Existing Razorpay billing is only for Koinia subscriptions. A church-owned gateway can be added later if the provider settles directly to the church and ownership can be verified. Platform settlement is not used.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
