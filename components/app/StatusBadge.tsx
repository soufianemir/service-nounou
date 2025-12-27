import { Badge } from "@/components/ui/badge";
import {
  APPROVAL_STATUS_LABEL,
  SHOPPING_STATUS_LABEL,
  TASK_STATUS_LABEL
} from "@/lib/labels";

type AnyStatus = keyof typeof TASK_STATUS_LABEL | keyof typeof SHOPPING_STATUS_LABEL | keyof typeof APPROVAL_STATUS_LABEL | string;

export function StatusBadge({ status }: { status: AnyStatus }) {
  const label =
    (TASK_STATUS_LABEL as Record<string, string>)[status] ??
    (SHOPPING_STATUS_LABEL as Record<string, string>)[status] ??
    (APPROVAL_STATUS_LABEL as Record<string, string>)[status] ??
    status;

  const positive = status === "DONE" || status === "BOUGHT" || status === "APPROVED";
  const negative = status === "SKIPPED" || status === "UNAVAILABLE" || status === "REJECTED";

  // Keep variants minimal (avoid introducing extra design tokens).
  const variant = positive ? "outline" : "muted";
  const tone = negative ? "text-red-600 dark:text-red-400" : "";

  return <Badge variant={variant} className={tone}>{label}</Badge>;
}
