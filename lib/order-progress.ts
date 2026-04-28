export const ORDER_PROGRESS_STATUSES = [
  "PENDING_APPROVAL",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "CUTTING",
  "STITCHING",
  "FINISHING",
  "READY",
  "DELIVERED",
] as const;

export type OrderProgressStatus = (typeof ORDER_PROGRESS_STATUSES)[number];

export const ORDER_PROGRESS_LABELS: Record<OrderProgressStatus, string> = {
  PENDING_APPROVAL: "Pending Approval",
  AWAITING_PAYMENT: "Awaiting Payment",
  CONFIRMED: "Confirmed",
  CUTTING: "Cutting",
  STITCHING: "Stitching",
  FINISHING: "Finishing",
  READY: "Ready",
  DELIVERED: "Delivered",
};

export const TAILOR_PROGRESS_STATUSES: OrderProgressStatus[] = [
  "CONFIRMED",
  "CUTTING",
  "STITCHING",
  "FINISHING",
  "READY",
  "DELIVERED",
];

export function getProgressStepIndex(status: OrderProgressStatus) {
  return ORDER_PROGRESS_STATUSES.indexOf(status);
}

export function canAdvanceToStatus(
  currentStatus: OrderProgressStatus,
  nextStatus: OrderProgressStatus,
) {
  const currentStep = getProgressStepIndex(currentStatus);
  const nextStep = getProgressStepIndex(nextStatus);

  if (currentStep === -1 || nextStep === -1) {
    return false;
  }

  return nextStep >= currentStep && nextStep - currentStep <= 1;
}
