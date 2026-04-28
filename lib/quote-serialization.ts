type QuoteLike = {
  fabricCost: unknown;
  stitchingCost: unknown;
  embroideryCost: unknown;
  deliveryCost: unknown;
  totalPrice: unknown;
};

function toNumber(value: unknown) {
  const parsedValue =
    typeof value === "number" ? value : Number(value ?? 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function serializeQuote<T extends QuoteLike | null>(quote: T): T {
  if (!quote) {
    return quote;
  }

  return {
    ...quote,
    fabricCost: toNumber(quote.fabricCost),
    stitchingCost: toNumber(quote.stitchingCost),
    embroideryCost: toNumber(quote.embroideryCost),
    deliveryCost: toNumber(quote.deliveryCost),
    totalPrice: toNumber(quote.totalPrice),
  };
}

export function serializePaymentAmount<T extends { amount: unknown } | null>(
  payment: T,
): T {
  if (!payment) {
    return payment;
  }

  return {
    ...payment,
    amount: toNumber(payment.amount),
  };
}
