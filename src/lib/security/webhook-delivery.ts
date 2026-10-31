/** Pure decision for webhook retries. Processed means the database update committed. */
export function webhookDeliveryAction(
  inserted: boolean,
  processedAt: Date | null
): "process" | "already_processed" {
  if (inserted) return "process";
  if (processedAt) return "already_processed";
  return "process";
}
