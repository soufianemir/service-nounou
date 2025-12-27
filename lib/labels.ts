export const TASK_STATUS_LABEL = {
  TODO: "À faire",
  DONE: "Fait",
  SKIPPED: "Non fait"
} as const;

export const SHOPPING_STATUS_LABEL = {
  OPEN: "À acheter",
  BOUGHT: "Acheté",
  UNAVAILABLE: "Introuvable"
} as const;

export const APPROVAL_STATUS_LABEL = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Refusé"
} as const;

export const APPROVAL_TYPE_LABEL: Record<string, string> = {
  EXPENSE_RECEIPT: "Justificatif"
};
