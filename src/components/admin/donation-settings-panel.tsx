"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  EyeOff,
  ImageIcon,
  Landmark,
  Link2,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizationOptional } from "@/context/organization-context";
import { useAdminChurchId } from "@/hooks/use-admin-church-id";
import {
  acceptDonationDeclaration,
  inspectDonationQr,
  loadChurchDonationSettings,
  lookupDonationIfsc,
  loadDonationQrPreview,
  removeDonationQr,
  saveDonationAcknowledgement,
  saveReceivingMethod,
  uploadDonationQr,
} from "@/lib/donations/church-receiving-actions";

const DEFAULT_DONOR_MESSAGE =
  "Thank you for your generous support. Your contribution helps our church continue its mission and serve our community.";

const MAX_QR_BYTES = 2 * 1024 * 1024;
const QR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const UPI_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

type Section = "qr" | "upi" | "bank" | "security" | "messages";
type Notice = { tone: "ok" | "err"; text: string } | null;

function Pill({ ready, on, off }: { ready: boolean; on: string; off: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${ready ? "bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
      <span className={`size-1.5 rounded-full ${ready ? "bg-emerald-600" : "bg-amber-500"}`} aria-hidden />
      {ready ? on : off}
    </span>
  );
}

export function DonationSettingsPanel() {
  const churchId = useAdminChurchId();
  const organization = useOrganizationOptional();
  const churchName = organization?.churches.find((church) => church.id === churchId)?.name;
  const [section, setSection] = useState<Section>("qr");
  const [declared, setDeclared] = useState(false);
  const [declaredAt, setDeclaredAt] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [upiEditing, setUpiEditing] = useState(true);
  const [holder, setHolder] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [branch, setBranch] = useState("");
  const [masked, setMasked] = useState("");
  const [bankEditing, setBankEditing] = useState(true);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [hasQr, setHasQr] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [decodedQr, setDecodedQr] = useState<{ upiId: string; payeeName: string; mismatch: boolean; configuredUpiId: string } | null>(null);
  const [confirmQr, setConfirmQr] = useState(false);
  const [confirmMismatch, setConfirmMismatch] = useState(false);
  const [ifscIdentity, setIfscIdentity] = useState<{ bankName: string; branch: string; city: string; state: string } | null>(null);
  const [ifscError, setIfscError] = useState<string | null>(null);
  const [donorMessage, setDonorMessage] = useState("");
  const [bankConfirmOpen, setBankConfirmOpen] = useState(false);
  const [encryptionConfigured, setEncryptionConfigured] = useState(false);

  useEffect(() => {
    if (!churchId) return;
    let cancelled = false;
    setLoading(true);
    void loadChurchDonationSettings(churchId)
      .then((settings) => {
        if (cancelled) return;
        setDeclared(settings.authorizedDeclaration);
        setDeclaredAt(settings.declarationAcceptedAt);
        const upi = settings.methods.find((method) => method.method === "upi_id");
        const bankMethod = settings.methods.find((method) => method.method === "bank_transfer");
        const qr = settings.methods.find((method) => method.method === "upi_qr");
        setHasQr(Boolean(qr?.hasQr));
        if (upi) {
          setDisplayName(upi.displayName);
          setUpiId(upi.upiId);
          setInstructions(upi.instructions);
          setUpiEditing(!UPI_PATTERN.test(upi.upiId.trim()));
        }
        if (bankMethod) {
          setHolder(bankMethod.accountHolderName);
          setBank(bankMethod.bankName);
          setIfsc(bankMethod.ifscCode);
          setBranch(bankMethod.branchName);
          setMasked(bankMethod.accountNumberMasked);
          const ready = Boolean(
            bankMethod.accountHolderName &&
              bankMethod.bankName &&
              IFSC_PATTERN.test(bankMethod.ifscCode.trim().toUpperCase()) &&
              bankMethod.accountNumberMasked
          );
          setBankEditing(!ready);
        }
        setDonorMessage(settings.donorAcknowledgement ?? "");
        setEncryptionConfigured(settings.encryptionConfigured);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load donation settings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    void loadDonationQrPreview(churchId)
      .then((preview) => {
        if (!cancelled) setQrPreview(preview?.url ?? null);
      })
      .catch(() => {
        if (!cancelled) setQrPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [churchId]);

  function chooseFile(next: File | null) {
    setUploadState("idle");
    setUploadError(null);
    setNotice(null);
    if (!next) {
      setFile(null);
      setLocalPreview(null);
      return;
    }
    if (!QR_TYPES.has(next.type) || next.size > MAX_QR_BYTES) {
      setFile(null);
      setLocalPreview(null);
      setUploadState("error");
      setUploadError("Use a JPEG, PNG, or WebP image up to 2 MB.");
      return;
    }
    setFile(next);
    setLocalPreview(URL.createObjectURL(next));
    setDecodedQr(null);
    setConfirmQr(false);
    setConfirmMismatch(false);
    if (!churchId) return;
    const data = new FormData();
    data.set("churchId", churchId);
    data.set("file", next);
    void inspectDonationQr(data)
      .then((result) => setDecodedQr(result))
      .catch((error: unknown) => {
        setFile(null);
        setLocalPreview(null);
        setUploadState("error");
        setUploadError(error instanceof Error ? error.message : "This image is not a valid UPI QR.");
      });
  }

  function flash(tone: "ok" | "err", text: string) {
    setNotice({ tone, text });
    if (tone === "ok") toast.success(text);
    else toast.error(text);
  }

  async function declare() {
    if (!churchId || busy) return;
    setBusy(true);
    try {
      await acceptDonationDeclaration(churchId);
      setDeclared(true);
      setDeclaredAt(new Date().toISOString());
      flash("ok", "Church authorization confirmed.");
    } catch (error) {
      flash("err", error instanceof Error ? error.message : "Could not save the declaration.");
    } finally {
      setBusy(false);
    }
  }

  async function saveUpi() {
    if (!churchId || busy) return;
    setBusy(true);
    try {
      const saved = await saveReceivingMethod({
        churchId,
        method: "upi_id",
        enabled: true,
        displayName: displayName || "Church UPI",
        instructions,
        upiId,
      });
      setUpiEditing(false);
      if (saved.authorizationRevoked) setDeclared(false);
      flash("ok", saved.authorizationRevoked ? "UPI ID saved. Confirm church authorization again before donors can use it." : "UPI ID saved.");
    } catch (error) {
      flash("err", error instanceof Error ? error.message : "Could not save the UPI ID.");
    } finally {
      setBusy(false);
    }
  }

  async function saveBank() {
    if (!churchId || busy) return;
    setBusy(true);
    try {
      const saved = await saveReceivingMethod({
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
      if (account) setMasked(`•••• ${account.replace(/\D/g, "").slice(-4)}`);
      setAccount("");
      setBankEditing(false);
      if (saved.authorizationRevoked) setDeclared(false);
      setBankConfirmOpen(false);
      flash("ok", saved.authorizationRevoked ? "Bank details saved securely. Confirm church authorization again before donors can use them." : "Bank details saved securely.");
    } catch (error) {
      flash("err", error instanceof Error ? error.message : "Could not save bank details.");
    } finally {
      setBusy(false);
    }
  }

  function previewAccount() {
    const digits = account.replace(/\D/g, "");
    if (digits.length >= 4) return `•••• ${digits.slice(-4)}`;
    if (account.trim()) return "••••";
    return masked || "Not entered";
  }

  async function saveQr() {
    if (!churchId || !file || busy) return;
    setBusy(true);
    setUploadState("uploading");
    setUploadError(null);
    try {
      const data = new FormData();
      data.set("churchId", churchId);
      data.set("file", file);
      data.set("confirmDetails", confirmQr ? "true" : "false");
      data.set("confirmMismatch", confirmMismatch ? "true" : "false");
      const saved = await uploadDonationQr(data);
      const preview = await loadDonationQrPreview(churchId);
      setQrPreview(preview?.url ?? null);
      setHasQr(Boolean(preview?.url));
      setFile(null);
      setLocalPreview(null);
      setUploadState("success");
      if (saved.authorizationRevoked) setDeclared(false);
      flash("ok", saved.authorizationRevoked ? "QR configuration saved. Confirm church authorization again before donors can use it." : "QR configuration saved.");
    } catch (error) {
      setUploadState("error");
      const message = error instanceof Error ? error.message : "Could not upload the QR image.";
      setUploadError(message);
      flash("err", message);
    } finally {
      setBusy(false);
    }
  }

  async function saveMessage() {
    if (!churchId || busy) return;
    if (donorMessage.trim().length > 400) {
      flash("err", "The thank-you message must be 400 characters or fewer.");
      return;
    }
    setBusy(true);
    try {
      await saveDonationAcknowledgement(churchId, donorMessage);
      setDonorMessage(donorMessage.trim());
      flash("ok", "Thank-you message saved. It appears after a gift is submitted for verification.");
    } catch (error) {
      flash("err", error instanceof Error ? error.message : "Could not save the message.");
    } finally {
      setBusy(false);
    }
  }

  async function removeQr() {
    if (!churchId || busy) return;
    if (!window.confirm("Remove the saved QR from donor payments?")) return;
    setBusy(true);
    try {
      await removeDonationQr(churchId);
      setQrPreview(null);
      setHasQr(false);
      setUploadState("idle");
      flash("ok", "QR removed from this church.");
    } catch (error) {
      flash("err", error instanceof Error ? error.message : "Could not remove the QR image.");
    } finally {
      setBusy(false);
    }
  }

  if (!churchId) {
    return <p className="text-sm text-muted-foreground">Select a church to configure donations.</p>;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] animate-pulse space-y-3" aria-busy="true" aria-label="Loading donation settings">
        <div className="h-16 rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-14 rounded-lg bg-muted" />)}
        </div>
        <div className="h-64 rounded-lg bg-muted" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3" role="alert">
        <p className="text-sm font-medium">Donation settings unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  const upiReady = UPI_PATTERN.test(upiId.trim());
  const ifscReady = IFSC_PATTERN.test(ifsc.trim().toUpperCase());
  const bankReady = Boolean(holder && bank && ifscReady && masked);
  const previewSrc = localPreview || qrPreview;
  const readyCount = [declared, hasQr, upiReady, bankReady].filter(Boolean).length;

  const nav: { id: Section; label: string; hint: string; icon: typeof QrCode; ready: boolean | null }[] = [
    { id: "qr", label: "UPI QR", hint: "Image", icon: QrCode, ready: hasQr },
    { id: "upi", label: "UPI ID", hint: "Identity", icon: Smartphone, ready: upiReady },
    { id: "bank", label: "Bank transfer", hint: "Account", icon: Landmark, ready: bankReady },
    { id: "security", label: "Security", hint: "Controls", icon: ShieldCheck, ready: null },
    { id: "messages", label: "Messages", hint: "Donors", icon: BadgeCheck, ready: Boolean(donorMessage.trim()) },
  ];

  const STATUS_LABEL = {
    not_configured: "Not configured",
    draft: "Draft",
    needs_review: "Needs review",
    ready: "Ready for donors",
    disabled: "Disabled",
  } as const;
  function methodState(valid: boolean) {
    if (!valid) return "not_configured" as const;
    if (!declared && declaredAt) return "needs_review" as const;
    if (!declared) return "draft" as const;
    return "ready" as const;
  }
  const overview: { id: Section; label: string; value: string }[] = [
    { id: "security", label: "Authorization", value: declared ? "Confirmed" : declaredAt ? "Needs review" : "Pending" },
    { id: "qr", label: "UPI QR", value: STATUS_LABEL[methodState(hasQr)] },
    { id: "upi", label: "UPI ID", value: STATUS_LABEL[methodState(upiReady)] },
    { id: "bank", label: "Bank transfer", value: STATUS_LABEL[methodState(bankReady)] },
  ];

  return (
    <div className="w-full space-y-3 text-[13px] leading-5 text-foreground">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Direct to church · INR</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Donation receiving</h2>
          <p className="text-muted-foreground">{churchName ?? "Selected church"} · Koinia does not collect or settle gifts</p>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">{readyCount} of 4 ready</p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {overview.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setSection(item.id)}
            className="rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-muted/40"
          >
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
            <span className="mt-0.5 block truncate font-medium tabular-nums">{item.value}</span>
          </button>
        ))}
      </div>

      {notice ? (
        <p role="status" className={`rounded-md px-3 py-2 text-xs ${notice.tone === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-destructive/10 text-destructive"}`}>
          {notice.text}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-card">
        <nav className="flex gap-1 overflow-x-auto border-b bg-muted/30 p-1" aria-label="Donation settings">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {section === "qr" ? (
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight">UPI QR</h3>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP up to 2 MB. Private object storage.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-3">
                <label
                  className={`flex h-[9.25rem] w-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-center ${dragOver ? "border-foreground bg-muted" : "border-border"}`}
                  onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    chooseFile(event.dataTransfer.files?.[0] ?? null);
                  }}
                >
                  <Upload className="mb-1 size-4 text-muted-foreground" aria-hidden />
                  <span className="text-xs font-medium">{dragOver ? "Drop image" : "Drop QR image"}</span>
                  <span className="text-[11px] text-muted-foreground">or choose a file</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
                </label>
                <div className="flex size-[9.25rem] items-center justify-center overflow-hidden rounded-md border bg-white">
                  {previewSrc ? <img src={previewSrc} alt="UPI QR preview" className="h-full w-full object-contain" /> : <ImageIcon className="size-4 text-muted-foreground" aria-hidden />}
                </div>
                <div className="min-w-[10rem] flex-1 space-y-1 text-xs text-muted-foreground">
                  <p>{file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : "No new file selected"}</p>
                  {uploadState === "uploading" ? <p className="text-foreground">Uploading…</p> : null}
                  {uploadState === "success" ? <p className="text-emerald-700">Saved privately</p> : null}
                  {uploadError ? <p className="text-destructive" role="alert">{uploadError}</p> : null}
                  <p>Admin preview links last about two minutes.</p>
                  {decodedQr ? (
                    <div className="space-y-1 rounded-md border px-2 py-1.5 text-foreground">
                      <p className="font-medium">{decodedQr.payeeName || "Payee name not in the QR"}</p>
                      <p className="font-mono">{decodedQr.upiId}</p>
                      <p className="text-[11px] text-muted-foreground">Decoded from the image. This does not prove ownership.</p>
                      {decodedQr.mismatch ? (
                        <p className="text-[11px] text-amber-800">This UPI ID differs from the saved ID {decodedQr.configuredUpiId}.</p>
                      ) : null}
                      <label className="flex items-start gap-2">
                        <input type="checkbox" className="mt-0.5" checked={confirmQr} onChange={(event) => setConfirmQr(event.target.checked)} />
                        <span>I reviewed these decoded details.</span>
                      </label>
                      {decodedQr.mismatch ? (
                        <label className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5" checked={confirmMismatch} onChange={(event) => setConfirmMismatch(event.target.checked)} />
                          <span>Save this QR even though the payee differs from the saved UPI ID.</span>
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" size="sm" className="h-8" disabled={busy || !file || !decodedQr || !confirmQr || (decodedQr.mismatch && !confirmMismatch)} onClick={() => void saveQr()}>{hasQr ? "Replace" : "Save QR"}</Button>
                    <Button type="button" size="sm" variant="outline" className="h-8" disabled={busy || !hasQr} onClick={() => void removeQr()}>Remove</Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {section === "upi" ? (
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight">UPI identity</h3>
                  <p className="text-xs text-muted-foreground">Shown to donors as saved. Format is not ownership.</p>
                </div>
              </div>
              {upiReady && !upiEditing ? (
                <div className="flex max-w-md items-start justify-between gap-3 rounded-md bg-muted/40 px-3 py-2.5">
                  <div>
                    <p className="font-medium">{displayName || "Church UPI"}</p>
                    <p className="font-mono text-[13px]">{upiId}</p>
                    {instructions ? <p className="mt-1 text-xs text-muted-foreground">{instructions}</p> : null}
                  </div>
                  <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setUpiEditing(true)}>Edit</Button>
                </div>
              ) : (
                <div className="grid max-w-[40rem] gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="upi-name" className="text-xs">Display name</Label>
                    <Input id="upi-name" className="h-9" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="upi-id" className="text-xs">UPI ID</Label>
                    <Input id="upi-id" className="h-9 font-mono" value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="name@bank" autoComplete="off" />
                    {upiId && !upiReady ? <p className="text-xs text-destructive">Use a form such as name@bank.</p> : null}
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="upi-notes" className="text-xs">Donor instructions</Label>
                    <Textarea id="upi-notes" rows={2} value={instructions} onChange={(event) => setInstructions(event.target.value)} />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="button" size="sm" className="h-8" disabled={busy || !upiReady} onClick={() => void saveUpi()}>{busy ? "Saving…" : "Save UPI ID"}</Button>
                    {upiReady ? <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setUpiEditing(false)}>Cancel</Button> : null}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {section === "bank" ? (
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight">Bank account</h3>
                  <p className="text-xs text-muted-foreground">AES-encrypted at rest. Donors see the last four digits.</p>
                </div>
              </div>
              {bankReady && !bankEditing ? (
                <div className="flex max-w-md items-start justify-between gap-3 rounded-md bg-muted/40 px-3 py-2.5">
                  <div>
                    <p className="font-medium">{holder}</p>
                    <p>{bank}{branch ? ` · ${branch}` : ""}</p>
                    <p className="font-mono tabular-nums">{masked}</p>
                    <p className="text-xs text-muted-foreground">IFSC {ifsc} · full number stays encrypted</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setBankEditing(true)}>Update</Button>
                </div>
              ) : (
                <div className="grid max-w-[42rem] gap-3 sm:grid-cols-2">
                  {masked ? <p className="text-xs text-muted-foreground sm:col-span-2">Saved as {masked}. Leave the number empty to keep it.</p> : null}
                  <div className="space-y-1">
                    <Label htmlFor="holder" className="text-xs">Account holder</Label>
                    <Input id="holder" className="h-9" value={holder} onChange={(event) => setHolder(event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bank" className="text-xs">Bank name</Label>
                    <Input id="bank" className="h-9" value={bank} onChange={(event) => setBank(event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="account" className="text-xs">Account number</Label>
                    <Input id="account" className="h-9 font-mono" value={account} onChange={(event) => setAccount(event.target.value)} autoComplete="off" inputMode="numeric" placeholder={masked ? "Unchanged if empty" : ""} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ifsc" className="text-xs">IFSC</Label>
                    <Input
                      id="ifsc"
                      className="h-9 font-mono uppercase"
                      value={ifsc}
                      onChange={(event) => {
                        setIfsc(event.target.value.toUpperCase());
                        setIfscIdentity(null);
                        setIfscError(null);
                      }}
                      onBlur={() => {
                        if (!IFSC_PATTERN.test(ifsc.trim().toUpperCase())) return;
                        void lookupDonationIfsc(ifsc)
                          .then((identity) => {
                            setIfscIdentity(identity);
                            setIfscError(null);
                            setBank((current) => current || identity.bankName);
                            setBranch((current) => current || identity.branch);
                          })
                          .catch((error: unknown) => {
                            setIfscIdentity(null);
                            setIfscError(error instanceof Error ? error.message : "Bank lookup failed.");
                          });
                      }}
                    />
                    {ifsc && !ifscReady ? <p className="text-xs text-destructive">Expected form ABCD0123456.</p> : null}
                    {ifscError ? <p className="text-xs text-destructive">{ifscError}</p> : null}
                    {ifscIdentity ? (
                      <p className="text-xs text-muted-foreground">
                        {ifscIdentity.bankName}{ifscIdentity.branch ? ` · ${ifscIdentity.branch}` : ""}
                        {ifscIdentity.city ? ` · ${ifscIdentity.city}` : ""}
                        . Lookup does not prove the account exists or belongs to the church. Ownership is not verified.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1 sm:max-w-xs">
                    <Label htmlFor="branch" className="text-xs">Branch</Label>
                    <Input id="branch" className="h-9" value={branch} onChange={(event) => setBranch(event.target.value)} />
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-2">
                    <Button type="button" size="sm" className="h-8" disabled={busy || !holder || !bank || !ifscReady || (!masked && !account)} onClick={() => setBankConfirmOpen(true)}>{busy ? "Saving…" : "Save Account"}</Button>
                    {bankReady ? <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => { setBankEditing(false); setAccount(""); }}>Cancel</Button> : null}
                  </div>
                </div>
              )}
              <AlertDialog open={bankConfirmOpen} onOpenChange={(open) => { if (!busy) setBankConfirmOpen(open); }}>
                <AlertDialogContent className="max-w-md gap-4">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm bank account details</AlertDialogTitle>
                    <AlertDialogDescription>Please review the bank account information before saving it.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">Account holder</dt>
                    <dd className="font-medium">{holder}</dd>
                    <dt className="text-muted-foreground">Bank name</dt>
                    <dd>{bank}</dd>
                    <dt className="text-muted-foreground">Account number</dt>
                    <dd className="font-mono tabular-nums">{previewAccount()}</dd>
                    <dt className="text-muted-foreground">IFSC code</dt>
                    <dd className="font-mono">{ifsc.trim().toUpperCase()}</dd>
                    <dt className="text-muted-foreground">Branch</dt>
                    <dd>{branch.trim() || "—"}</dd>
                  </dl>
                  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                    <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>
                      {encryptionConfigured
                        ? "Account details are encrypted at rest. Bank and account ownership have not been independently verified by Koinia."
                        : "Bank and account ownership have not been independently verified by Koinia."}
                    </span>
                  </p>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                    <Button type="button" size="sm" disabled={busy} onClick={() => void saveBank()}>
                      {busy ? "Saving…" : "Confirm & Save"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : null}

          {section === "messages" ? (
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
              <div className="space-y-2">
                <h3 className="font-semibold tracking-tight">Thank-you message</h3>
                <p className="text-xs text-muted-foreground">
                  Shown after a donor submits a reference. That screen stays “awaiting verification” until the church verifies the gift.
                </p>
                <Label htmlFor="donor-message" className="text-xs">Message</Label>
                <Textarea
                  id="donor-message"
                  rows={4}
                  maxLength={400}
                  value={donorMessage}
                  onChange={(event) => setDonorMessage(event.target.value)}
                  placeholder={DEFAULT_DONOR_MESSAGE}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] tabular-nums text-muted-foreground">{donorMessage.trim().length}/400</span>
                  <Button type="button" size="sm" className="h-8" disabled={busy} onClick={() => void saveMessage()}>
                    {busy ? "Saving…" : "Save message"}
                  </Button>
                </div>
                <div className="space-y-2 border-t pt-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Donor confirmation email</p>
                  <p>Direct church gifts do not send a donor email. A reference stays awaiting verification until a manager verifies it.</p>
                  <p>A fixed receipt email exists only after a completed gateway donation. Its wording is not configurable here, and it is not sent for an unverified submission.</p>
                  <p className="font-medium text-foreground">Statuses</p>
                  <p>Submitted and awaiting verification are not a completed payment. Verified is recorded only after review. Rejected gifts are not shown as received.</p>
                </div>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Donor preview</p>
                <p className="mt-2 text-sm font-medium">Submitted · awaiting verification</p>
                <p className="mt-1 text-xs text-muted-foreground">This is not a completed payment.</p>
                <p className="mt-2 text-sm">{donorMessage.trim() || DEFAULT_DONOR_MESSAGE}</p>
              </div>
            </div>
          ) : null}

          {section === "security" ? (
            <div className="p-4">
              <h3 className="font-semibold tracking-tight">Protection</h3>
              <p className="mb-3 text-xs text-muted-foreground">Product controls in use. Not a certification, audit, or PCI claim.</p>
              <ul className="divide-y rounded-md border">
                {[
                  [Lock, "Encryption at rest", "Account numbers are AES-encrypted before they are stored."],
                  [ImageIcon, "Private QR storage", "QR files are kept in private object storage for this church."],
                  [Link2, "Signed previews", "Managers receive a short-lived signed URL to preview the QR."],
                  [Users, "Church-scoped access", "Only a manager of this church can load or change these settings."],
                  [EyeOff, "Masking", "Editors and donors see the last four digits, never the full number."],
                  [ClipboardCheck, "Review record", "Offline gifts can be verified or rejected, and the decision is recorded."],
                ].map(([Icon, title, body]) => {
                  const Glyph = Icon as typeof Lock;
                  return (
                    <li key={title as string} className="flex items-start gap-3 px-3 py-2">
                      <Glyph className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{title as string}</p>
                        <p className="text-xs text-muted-foreground">{body as string}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-emerald-700">Live</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4" aria-hidden />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold tracking-tight">Church authorization</h3>
                  <p className="text-xs text-muted-foreground">The church confirms it may receive into these methods. Koinia does not verify ownership.</p>
                </div>
                <Pill ready={declared} on="Confirmed" off="Needed" />
              </div>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" checked={declared} onChange={(event) => setDeclared(event.target.checked)} />
                <span>This church is authorized to receive donations into the methods configured here.</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" className="h-8" disabled={busy || !declared} onClick={() => void declare()}>Confirm</Button>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  {declaredAt ? <><BadgeCheck className="size-3.5 text-emerald-700" aria-hidden /> Saved {new Date(declaredAt).toLocaleString()}</> : "Not saved yet"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold tracking-tight">Donor view</h3>
            <span className="text-[11px] text-muted-foreground">Paid to the church</span>
          </div>
          {!hasQr && !upiReady && !bankReady ? (
            <p className="text-xs text-muted-foreground">Nothing is ready for donors yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {hasQr && qrPreview ? (
                <li className="flex items-center gap-3 px-3 py-2">
                  <img src={qrPreview} alt="Donor UPI QR" className="size-12 rounded border bg-white object-contain" />
                  <div>
                    <p className="font-medium">UPI QR</p>
                    <p className="text-xs text-muted-foreground">Scan to pay the church</p>
                  </div>
                </li>
              ) : null}
              {upiReady ? (
                <li className="flex items-center gap-3 px-3 py-2">
                  <Smartphone className="size-4 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-medium">{displayName || "Church UPI"}</p>
                    <p className="truncate font-mono text-xs">{upiId}</p>
                  </div>
                </li>
              ) : null}
              {bankReady ? (
                <li className="flex items-center gap-3 px-3 py-2">
                  <Building2 className="size-4 text-muted-foreground" aria-hidden />
                  <div className="text-xs">
                    <p className="font-medium">{bank}</p>
                    <p className="text-muted-foreground">{holder} · {masked}{branch ? ` · ${branch}` : ""}</p>
                  </div>
                </li>
              ) : null}
            </ul>
          )}
        </section>
      </div>

      <dl className="grid gap-x-8 gap-y-1 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="flex justify-between gap-4"><dt>Currency</dt><dd className="text-foreground">INR only</dd></div>
        <div className="flex justify-between gap-4"><dt>Settlement</dt><dd className="text-foreground">Church receives directly</dd></div>
        <div className="flex justify-between gap-4"><dt>Subscriptions</dt><dd className="text-foreground">Razorpay, not gifts</dd></div>
        <div className="flex justify-between gap-4"><dt>Campaigns</dt><dd className="text-foreground">Paid plan required</dd></div>
      </dl>
    </div>
  );
}
