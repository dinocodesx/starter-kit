/**
 * Shared Razorpay payment types.
 *
 * Consumed by:
 *   - @creator-suite/payments  (service layer / workflows)
 *   - @creator-suite/db-pg     (Prisma-backed store implementation)
 *
 * Defined here to avoid a circular dependency between those two packages.
 */

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

/** A plain JSON object accepted by Razorpay API fields. */
export type RazorpayJson = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Record shapes (mirror the database rows)
// ---------------------------------------------------------------------------

export interface RazorpayOrderRecord {
  id: string;
  userId: string | null;
  receipt: string;
  razorpayOrderId: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string;
  attempts: number;
  notes: unknown;
  rawPayload: unknown;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RazorpayPaymentRecord {
  id: string;
  orderId: string | null;
  userId: string | null;
  razorpayPaymentId: string;
  razorpayOrderId: string | null;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  email: string | null;
  contact: string | null;
  captured: boolean;
  refunded: boolean;
  fee: number | null;
  tax: number | null;
  errorCode: string | null;
  errorDescription: string | null;
  rawPayload: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface RazorpayPlanRecord {
  id: string;
  localKey: string;
  razorpayPlanId: string;
  name: string;
  description: string | null;
  period: string;
  interval: number;
  amount: number;
  currency: string;
  notes: unknown;
  rawPayload: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface RazorpaySubscriptionRecord {
  id: string;
  userId: string | null;
  planId: string | null;
  razorpaySubscriptionId: string;
  razorpayPlanId: string;
  razorpayCustomerId: string | null;
  customerEmail: string | null;
  status: string;
  quantity: number;
  totalCount: number | null;
  paidCount: number | null;
  remainingCount: number | null;
  currentStart: Date | null;
  currentEnd: Date | null;
  chargeAt: Date | null;
  startAt: Date | null;
  endAt: Date | null;
  endedAt: Date | null;
  shortUrl: string | null;
  notes: unknown;
  rawPayload: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface RazorpayWebhookEventRecord {
  id: string;
  eventId: string;
  eventType: string;
  signature: string;
  status: string;
  payload: unknown;
  error: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Input shapes (write operations)
// ---------------------------------------------------------------------------

export interface UpsertRazorpayOrderInput {
  userId?: string | null;
  receipt: string;
  razorpayOrderId: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string;
  attempts: number;
  notes?: RazorpayJson | null;
  rawPayload?: RazorpayJson | null;
  paidAt?: Date | null;
}

export interface UpsertRazorpayPaymentInput {
  userId?: string | null;
  razorpayPaymentId: string;
  razorpayOrderId?: string | null;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
  email?: string | null;
  contact?: string | null;
  captured?: boolean;
  refunded?: boolean;
  fee?: number | null;
  tax?: number | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  rawPayload?: RazorpayJson | null;
}

export interface UpsertRazorpayPlanInput {
  localKey: string;
  razorpayPlanId: string;
  name: string;
  description?: string | null;
  period: string;
  interval: number;
  amount: number;
  currency: string;
  notes?: RazorpayJson | null;
  rawPayload?: RazorpayJson | null;
}

export interface UpsertRazorpaySubscriptionInput {
  userId?: string | null;
  razorpaySubscriptionId: string;
  razorpayPlanId: string;
  razorpayCustomerId?: string | null;
  customerEmail?: string | null;
  status: string;
  quantity: number;
  totalCount?: number | null;
  paidCount?: number | null;
  remainingCount?: number | null;
  currentStart?: Date | null;
  currentEnd?: Date | null;
  chargeAt?: Date | null;
  startAt?: Date | null;
  endAt?: Date | null;
  endedAt?: Date | null;
  shortUrl?: string | null;
  notes?: RazorpayJson | null;
  rawPayload?: RazorpayJson | null;
}

export interface CreateRazorpayWebhookEventInput {
  eventId: string;
  eventType: string;
  signature: string;
  payload: RazorpayJson;
}

// ---------------------------------------------------------------------------
// Store interface (implemented by @creator-suite/db-pg)
// ---------------------------------------------------------------------------

export interface RazorpayPaymentStore {
  upsertOrder(input: UpsertRazorpayOrderInput): Promise<RazorpayOrderRecord>;
  markOrderPaid(razorpayOrderId: string): Promise<RazorpayOrderRecord | null>;
  upsertPayment(input: UpsertRazorpayPaymentInput): Promise<RazorpayPaymentRecord>;
  upsertPlan(input: UpsertRazorpayPlanInput): Promise<RazorpayPlanRecord>;
  upsertSubscription(
    input: UpsertRazorpaySubscriptionInput,
  ): Promise<RazorpaySubscriptionRecord>;
  findWebhookEvent(eventId: string): Promise<RazorpayWebhookEventRecord | null>;
  createWebhookEvent(
    input: CreateRazorpayWebhookEventInput,
  ): Promise<RazorpayWebhookEventRecord>;
  markWebhookEventFailed(eventId: string, error: string): Promise<RazorpayWebhookEventRecord>;
}
