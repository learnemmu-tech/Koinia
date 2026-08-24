"use client";

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
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>
            Default currency shown on donation campaigns and receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="donation-currency">Default currency</Label>
          <Select defaultValue="USD" disabled>
            <SelectTrigger id="donation-currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD — US Dollar</SelectItem>
              <SelectItem value="INR">INR — Indian Rupee</SelectItem>
              <SelectItem value="EUR">EUR — Euro</SelectItem>
              <SelectItem value="GBP">GBP — British Pound</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Currency configuration will be available in a future update.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment gateway</CardTitle>
          <CardDescription>
            Connect Razorpay or Stripe to accept online donations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="payment-provider">Provider</Label>
            <Select disabled>
              <SelectTrigger id="payment-provider">
                <SelectValue placeholder="Choose a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Payment gateway setup is coming soon.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Donation campaigns</CardTitle>
          <CardDescription>
            Default messaging and behavior for new campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="campaign-thank-you">Default thank-you message</Label>
          <Textarea
            id="campaign-thank-you"
            disabled
            placeholder="Thank you for your generous gift."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Manage live campaigns from Dashboard → Content → Donations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout information</CardTitle>
          <CardDescription>
            Bank or payout details for received donations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="payout-email">Payout contact email</Label>
          <Input
            id="payout-email"
            type="email"
            disabled
            placeholder="finance@yourchurch.org"
          />
          <p className="text-xs text-muted-foreground">
            Payout configuration will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
