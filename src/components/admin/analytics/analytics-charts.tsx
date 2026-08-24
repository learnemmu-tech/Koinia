"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  type ContentGrowthPoint,
  type MonthlyDonationPoint,
} from "@/lib/admin-analytics-utils";

import { AnalyticsEmptyState } from "./analytics-stat-cards";

type AnalyticsDonationsChartProps = {
  data: MonthlyDonationPoint[];
  loading?: boolean;
};

export function AnalyticsDonationsChart({
  data,
  loading = false,
}: AnalyticsDonationsChartProps) {
  const hasData = data.some((point) => point.amount > 0);

  return (
    <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />
      <CardHeader className="p-5 pb-2">
        <CardTitle className="font-heading text-base">
          Monthly Donations
        </CardTitle>
        <CardDescription>
          Completed gifts grouped by month (last 12 months)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-5 pt-2 sm:px-5">
        {loading ?
          <Skeleton className="h-[280px] w-full rounded-xl" />
        : hasData ?
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} width={56} />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value ?? 0)),
                    "Amount",
                  ]}
                  labelFormatter={(label) => String(label)}
                />
                <Bar
                  dataKey="amount"
                  name="Amount"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        : <AnalyticsEmptyState label="No completed donations in the last 12 months" />}
      </CardContent>
    </Card>
  );
}

type AnalyticsContentGrowthChartProps = {
  data: ContentGrowthPoint[];
  loading?: boolean;
};

export function AnalyticsContentGrowthChart({
  data,
  loading = false,
}: AnalyticsContentGrowthChartProps) {
  const hasData = data.some(
    (point) => point.songs > 0 || point.sermons > 0 || point.articles > 0
  );

  return (
    <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />
      <CardHeader className="p-5 pb-2">
        <CardTitle className="font-heading text-base">Content Growth</CardTitle>
        <CardDescription>
          Cumulative songs, sermons, and articles over time
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-5 pt-2 sm:px-5">
        {loading ?
          <Skeleton className="h-[280px] w-full rounded-xl" />
        : hasData ?
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} width={40} allowDecimals={false} />
                <Tooltip labelFormatter={(label) => String(label)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="songs"
                  name="Songs"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="sermons"
                  name="Sermons"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="articles"
                  name="Articles"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        : <AnalyticsEmptyState label="No content published yet" />}
      </CardContent>
    </Card>
  );
}
