import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SuperAdminStatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-semibold tracking-tight">
          {value.toLocaleString("en-US")}
        </p>
      </CardContent>
    </Card>
  );
}
