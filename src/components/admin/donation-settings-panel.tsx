"use client";

import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function DonationSettingsPanel() {
  const t = useTranslations("donationSettings");
  const tForms = useTranslations("forms");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("currencyTitle")}</CardTitle>
          <CardDescription>{t("currencyDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="donation-currency">{tForms("defaultCurrency")}</Label>
          <Select defaultValue="USD" disabled>
            <SelectTrigger id="donation-currency">
              <SelectValue placeholder={tForms("selectCurrency")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD — US Dollar</SelectItem>
              <SelectItem value="INR">INR — Indian Rupee</SelectItem>
              <SelectItem value="EUR">EUR — Euro</SelectItem>
              <SelectItem value="GBP">GBP — British Pound</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("currencyFutureNote")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("paymentGatewayTitle")}</CardTitle>
          <CardDescription>{t("paymentGatewayDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="payment-provider">{tForms("provider")}</Label>
            <Select disabled>
              <SelectTrigger id="payment-provider">
                <SelectValue placeholder={tForms("placeholders.chooseProvider")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">{t("paymentGatewayFutureNote")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("campaignsTitle")}</CardTitle>
          <CardDescription>{t("campaignsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="campaign-thank-you">{tForms("defaultThankYouMessage")}</Label>
          <Textarea
            id="campaign-thank-you"
            disabled
            placeholder={tForms("placeholders.thankYouMessage")}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">{t("campaignsManageNote")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("payoutTitle")}</CardTitle>
          <CardDescription>{t("payoutDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="payout-email">{tForms("payoutContactEmail")}</Label>
          <Input
            id="payout-email"
            type="email"
            disabled
            placeholder={tForms("placeholders.payoutEmail")}
          />
          <p className="text-xs text-muted-foreground">{t("payoutFutureNote")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
