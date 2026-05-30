import type { RazorpayJson } from "./store";
import type { RazorpayEntity } from "./client";
import type { CreateRazorpayPlanInput } from "./service";

// ---------------------------------------------------------------------------
// Primitive coercers
// ---------------------------------------------------------------------------

/** Returns `value` as a `Date` if it is a Unix-seconds number, else `null`. */
export function fromUnixSeconds(value: unknown) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

/** Converts a `Date` to Unix seconds (used when building Razorpay API bodies). */
export function toUnixSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

/** Returns `value` as a string if it is one, else `null`. */
export function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

/** Returns `value` as a number if it is one, else `null`. */
export function numberValue(value: unknown) {
  return typeof value === "number" ? value : null;
}

/** Returns `value` as a boolean if it is one, else `null`. */
export function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

/**
 * Returns `value` as a `RazorpayJson` (plain object) if it is one, else `null`.
 * Arrays and `null` are excluded even though they are technically JSON.
 */
export function objectValue(value: unknown): RazorpayJson | null {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as RazorpayJson;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Required-field extractors
// ---------------------------------------------------------------------------

/** Extracts a required string field from a Razorpay entity. Throws if absent. */
export function requireString(entity: RazorpayEntity, key: string) {
  const value = stringValue(entity[key]);
  if (!value) {
    throw new Error(`Razorpay response did not include required string field "${key}".`);
  }
  return value;
}

/** Extracts a required numeric field from a Razorpay entity. Throws if absent. */
export function requireNumber(entity: RazorpayEntity, key: string) {
  const value = numberValue(entity[key]);
  if (value === null) {
    throw new Error(`Razorpay response did not include required numeric field "${key}".`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Entity mappers (Razorpay API shape → store input shape)
// ---------------------------------------------------------------------------

/** Maps a raw Razorpay order entity to `UpsertRazorpayOrderInput`. */
export function mapOrderEntity(entity: RazorpayEntity, userId?: string | null, paymentEntity?: RazorpayEntity | null) {
  const status = requireString(entity, "status");
  const amount = requireNumber(entity, "amount");
  const amountPaid = numberValue(entity.amount_paid) ?? 0;

  let paidAt: Date | null = null;
  if (status === "paid") {
    const timestamp = (paymentEntity ? (numberValue(paymentEntity.created_at) ?? numberValue(paymentEntity.captured_at)) : null)
      ?? numberValue(entity.created_at);
    paidAt = fromUnixSeconds(timestamp) ?? new Date();
  }

  return {
    userId: userId ?? null,
    receipt: requireString(entity, "receipt"),
    razorpayOrderId: requireString(entity, "id"),
    amount,
    amountPaid,
    amountDue: numberValue(entity.amount_due) ?? Math.max(amount - amountPaid, 0),
    currency: requireString(entity, "currency"),
    status,
    attempts: numberValue(entity.attempts) ?? 0,
    notes: objectValue(entity.notes),
    rawPayload: entity,
    paidAt,
  };
}

/** Maps a raw Razorpay payment entity to `UpsertRazorpayPaymentInput`. */
export function mapPaymentEntity(entity: RazorpayEntity, userId?: string | null) {
  return {
    userId: userId ?? null,
    razorpayPaymentId: requireString(entity, "id"),
    razorpayOrderId: stringValue(entity.order_id),
    amount: requireNumber(entity, "amount"),
    currency: requireString(entity, "currency"),
    status: requireString(entity, "status"),
    method: stringValue(entity.method),
    email: stringValue(entity.email),
    contact: stringValue(entity.contact),
    captured: booleanValue(entity.captured) ?? false,
    refunded: booleanValue(entity.refunded) ?? false,
    fee: numberValue(entity.fee),
    tax: numberValue(entity.tax),
    errorCode: stringValue(entity.error_code),
    errorDescription: stringValue(entity.error_description),
    rawPayload: entity,
  };
}

/** Maps a raw Razorpay plan entity to `UpsertRazorpayPlanInput`. */
export function mapPlanEntity(
  entity: RazorpayEntity,
  input: CreateRazorpayPlanInput,
  currency: string,
) {
  const item = objectValue(entity.item) ?? {};

  return {
    localKey: input.localKey,
    razorpayPlanId: requireString(entity, "id"),
    name: stringValue(item.name) ?? input.name,
    description: stringValue(item.description) ?? input.description ?? null,
    period: requireString(entity, "period"),
    interval: requireNumber(entity, "interval"),
    amount: numberValue(item.amount) ?? input.amount,
    currency: stringValue(item.currency) ?? currency,
    notes: objectValue(entity.notes) ?? input.notes ?? null,
    rawPayload: entity,
  };
}

/** Maps a raw Razorpay subscription entity to `UpsertRazorpaySubscriptionInput`. */
export function mapSubscriptionEntity(entity: RazorpayEntity, userId?: string | null) {
  return {
    userId: userId ?? null,
    razorpaySubscriptionId: requireString(entity, "id"),
    razorpayPlanId: requireString(entity, "plan_id"),
    razorpayCustomerId: stringValue(entity.customer_id),
    customerEmail: stringValue(entity.customer_email),
    status: requireString(entity, "status"),
    quantity: numberValue(entity.quantity) ?? 1,
    totalCount: numberValue(entity.total_count),
    paidCount: numberValue(entity.paid_count),
    remainingCount: numberValue(entity.remaining_count),
    currentStart: fromUnixSeconds(entity.current_start),
    currentEnd: fromUnixSeconds(entity.current_end),
    chargeAt: fromUnixSeconds(entity.charge_at),
    startAt: fromUnixSeconds(entity.start_at),
    endAt: fromUnixSeconds(entity.end_at),
    endedAt: fromUnixSeconds(entity.ended_at),
    shortUrl: stringValue(entity.short_url),
    notes: objectValue(entity.notes),
    rawPayload: entity,
  };
}

// ---------------------------------------------------------------------------
// Webhook helpers
// ---------------------------------------------------------------------------

/**
 * Extracts a named entity object from inside a Razorpay webhook payload.
 * Razorpay wraps entities as: `payload.<entityName>.entity`.
 */
export function getWebhookEntity(payload: RazorpayJson, entityName: string) {
  const wrapper = objectValue(payload.payload)?.[entityName];
  return objectValue(wrapper)?.entity ? objectValue(objectValue(wrapper)?.entity) : null;
}

/** Serialises an unknown caught error to a plain string for storage. */
export function stringifyError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Razorpay error";
  }
}
