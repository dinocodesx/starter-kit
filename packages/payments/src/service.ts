import Razorpay from "razorpay";
import type {
  RazorpayJson,
  RazorpayPaymentStore,
  RazorpayOrderRecord,
  RazorpayPaymentRecord,
  RazorpayPlanRecord,
  RazorpaySubscriptionRecord,
  RazorpayWebhookEventRecord,
} from "./store";
import type { RazorpayClient } from "./client";
import {
  buildReceipt,
  createSignature,
  assertValidSignature,
} from "./crypto";
import {
  toUnixSeconds,
  stringValue,
  mapOrderEntity,
  mapPaymentEntity,
  mapPlanEntity,
  mapSubscriptionEntity,
  getWebhookEntity,
  stringifyError,
} from "./mappers";

// ---------------------------------------------------------------------------
// Public option / input / result types
// ---------------------------------------------------------------------------

export interface CreateRazorpayPaymentServiceOptions {
  store: RazorpayPaymentStore;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  defaultCurrency?: string;
  /** Optional pre-built client; useful for injecting a test double. */
  client?: RazorpayClient;
}

export interface CreateRazorpayOrderInput {
  amount: number;
  userId?: string | null;
  currency?: string;
  receipt?: string;
  notes?: RazorpayJson;
  partialPayment?: boolean;
  firstPaymentMinAmount?: number;
}

export interface RazorpayCheckoutOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  notes: RazorpayJson | null;
  order: RazorpayOrderRecord;
}

export interface VerifyRazorpayCheckoutPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  userId?: string | null;
}

export interface VerifyRazorpayCheckoutPaymentResult {
  verified: true;
  order: RazorpayOrderRecord | null;
  payment: RazorpayPaymentRecord;
}

export interface CreateRazorpayPlanInput {
  localKey: string;
  name: string;
  amount: number;
  period: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  currency?: string;
  description?: string;
  notes?: RazorpayJson;
}

export interface CreateRazorpaySubscriptionInput {
  userId?: string | null;
  razorpayPlanId: string;
  totalCount: number;
  quantity?: number;
  startAt?: Date;
  expireBy?: Date;
  customerNotify?: boolean;
  offerId?: string;
  notes?: RazorpayJson;
}

export interface RazorpaySubscriptionCheckout {
  keyId: string;
  subscriptionId: string;
  status: string;
  shortUrl: string | null;
  subscription: RazorpaySubscriptionRecord;
}

export interface CancelRazorpaySubscriptionInput {
  subscriptionId: string;
  cancelAtCycleEnd?: boolean;
}

export interface HandleRazorpayWebhookInput {
  rawBody: string | Buffer;
  signature: string;
  eventId: string;
}

export interface HandleRazorpayWebhookResult {
  duplicate: boolean;
  event: RazorpayWebhookEventRecord;
}

export interface RazorpayPaymentService {
  createOrder(input: CreateRazorpayOrderInput): Promise<RazorpayCheckoutOrder>;
  verifyCheckoutPayment(
    input: VerifyRazorpayCheckoutPaymentInput,
  ): Promise<VerifyRazorpayCheckoutPaymentResult>;
  createPlan(input: CreateRazorpayPlanInput): Promise<RazorpayPlanRecord>;
  createSubscription(
    input: CreateRazorpaySubscriptionInput,
  ): Promise<RazorpaySubscriptionCheckout>;
  cancelSubscription(
    input: CancelRazorpaySubscriptionInput,
  ): Promise<RazorpaySubscriptionRecord>;
  handleWebhook(input: HandleRazorpayWebhookInput): Promise<HandleRazorpayWebhookResult>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a Razorpay payment service that orchestrates order, payment,
 * subscription, and webhook workflows against the provided store adapter.
 *
 * @example
 * const service = createRazorpayPaymentService({
 *   store: createPrismaRazorpayPaymentStore(prisma),
 *   keyId: process.env.RAZORPAY_KEY_ID,
 *   keySecret: process.env.RAZORPAY_KEY_SECRET,
 *   webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
 * });
 */
export function createRazorpayPaymentService({
  store,
  keyId,
  keySecret,
  webhookSecret,
  defaultCurrency = "INR",
  client,
}: CreateRazorpayPaymentServiceOptions): RazorpayPaymentService {
  if (!keyId || !keySecret || !webhookSecret) {
    throw new Error("Razorpay keyId, keySecret, and webhookSecret are required.");
  }

  const razorpay =
    client ??
    (new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }) as unknown as RazorpayClient);

  // -------------------------------------------------------------------------
  // Order workflow
  // -------------------------------------------------------------------------

  async function createOrder(input: CreateRazorpayOrderInput) {
    const currency = input.currency ?? defaultCurrency;
    const receipt = input.receipt ?? buildReceipt();
    const notes = input.notes ?? null;
    const order = await razorpay.orders.create({
      amount: input.amount,
      currency,
      receipt,
      notes: notes ?? undefined,
      partial_payment: input.partialPayment,
      first_payment_min_amount: input.firstPaymentMinAmount,
    });

    const savedOrder = await store.upsertOrder(mapOrderEntity(order, input.userId));

    return {
      keyId,
      orderId: savedOrder.razorpayOrderId,
      amount: savedOrder.amount,
      currency: savedOrder.currency,
      receipt: savedOrder.receipt,
      notes,
      order: savedOrder,
    };
  }

  async function verifyCheckoutPayment(input: VerifyRazorpayCheckoutPaymentInput) {
    assertValidSignature(
      `${input.razorpayOrderId}|${input.razorpayPaymentId}`,
      input.razorpaySignature,
      keySecret,
    );

    const paymentEntity = await razorpay.payments.fetch(input.razorpayPaymentId);
    const payment = await store.upsertPayment(
      mapPaymentEntity(paymentEntity, input.userId),
    );
    const order =
      payment.razorpayOrderId && payment.captured
        ? await store.markOrderPaid(payment.razorpayOrderId)
        : null;

    return {
      verified: true as const,
      order,
      payment,
    };
  }

  // -------------------------------------------------------------------------
  // Subscription workflow
  // -------------------------------------------------------------------------

  async function createPlan(input: CreateRazorpayPlanInput) {
    const currency = input.currency ?? defaultCurrency;
    const plan = await razorpay.plans.create({
      period: input.period,
      interval: input.interval ?? 1,
      item: {
        name: input.name,
        description: input.description,
        amount: input.amount,
        currency,
      },
      notes: input.notes,
    });

    return store.upsertPlan(mapPlanEntity(plan, input, currency));
  }

  async function createSubscription(input: CreateRazorpaySubscriptionInput) {
    const subscription = await razorpay.subscriptions.create({
      plan_id: input.razorpayPlanId,
      total_count: input.totalCount,
      quantity: input.quantity ?? 1,
      start_at: input.startAt ? toUnixSeconds(input.startAt) : undefined,
      expire_by: input.expireBy ? toUnixSeconds(input.expireBy) : undefined,
      customer_notify: input.customerNotify ?? true,
      offer_id: input.offerId,
      notes: input.notes,
    });
    const savedSubscription = await store.upsertSubscription(
      mapSubscriptionEntity(subscription, input.userId),
    );

    return {
      keyId,
      subscriptionId: savedSubscription.razorpaySubscriptionId,
      status: savedSubscription.status,
      shortUrl: savedSubscription.shortUrl,
      subscription: savedSubscription,
    };
  }

  async function cancelSubscription(input: CancelRazorpaySubscriptionInput) {
    const subscription = await razorpay.subscriptions.cancel(input.subscriptionId, {
      cancel_at_cycle_end: input.cancelAtCycleEnd ?? false,
    });

    return store.upsertSubscription(mapSubscriptionEntity(subscription));
  }

  // -------------------------------------------------------------------------
  // Webhook workflow
  // -------------------------------------------------------------------------

  async function handleWebhook(input: HandleRazorpayWebhookInput) {
    assertValidSignature(input.rawBody, input.signature, webhookSecret);

    const duplicate = await store.findWebhookEvent(input.eventId);
    if (duplicate) {
      return {
        duplicate: true,
        event: duplicate,
      };
    }

    const bodyText = Buffer.isBuffer(input.rawBody)
      ? input.rawBody.toString("utf8")
      : input.rawBody;
    const payload = JSON.parse(bodyText) as RazorpayJson;
    const eventType = stringValue(payload.event) ?? "unknown";
    const event = await store.createWebhookEvent({
      eventId: input.eventId,
      eventType,
      signature: input.signature,
      payload,
    });

    try {
      const payment = getWebhookEntity(payload, "payment");
      if (payment) {
        await store.upsertPayment(mapPaymentEntity(payment));
      }

      const order = getWebhookEntity(payload, "order");
      if (order) {
        await store.upsertOrder(mapOrderEntity(order, null, payment));
      }

      const subscription = getWebhookEntity(payload, "subscription");
      if (subscription) {
        await store.upsertSubscription(mapSubscriptionEntity(subscription));
      }

      if (eventType === "order.paid") {
        const orderId = order ? stringValue(order.id) : null;
        if (orderId) {
          await store.markOrderPaid(orderId);
        }
      }

      return {
        duplicate: false,
        event,
      };
    } catch (error) {
      const failedEvent = await store.markWebhookEventFailed(
        input.eventId,
        stringifyError(error),
      );
      throw Object.assign(error instanceof Error ? error : new Error(stringifyError(error)), {
        webhookEvent: failedEvent,
      });
    }
  }

  return {
    createOrder,
    verifyCheckoutPayment,
    createPlan,
    createSubscription,
    cancelSubscription,
    handleWebhook,
  };
}

// ---------------------------------------------------------------------------
// Test utilities (not part of the public API)
// ---------------------------------------------------------------------------

/** @internal Exposed for unit tests that need to generate matching signatures. */
export const __testing = {
  createSignature,
};
