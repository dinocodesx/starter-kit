import { EmailDeliveryStatus } from "./client";
import type { PrismaClient, Prisma } from "./client";
import type {
  DeliveryRecord,
  CreateDeliveryInput,
  DeliveryStore,
  RazorpayJson,
  RazorpayOrderRecord,
  RazorpayPaymentRecord,
  RazorpayPlanRecord,
  RazorpaySubscriptionRecord,
  RazorpayWebhookEventRecord,
  UpsertRazorpayOrderInput,
  UpsertRazorpayPaymentInput,
  UpsertRazorpayPlanInput,
  UpsertRazorpaySubscriptionInput,
  CreateRazorpayWebhookEventInput,
  RazorpayPaymentStore,
} from "@creator-suite/types";

/**
 * Safely converts an unknown payload value to a Prisma-compatible Json object.
 * Prisma's Json field rejects null, arrays, and primitives at the type level,
 * so we fall back to an empty object for anything that isn't a plain object.
 */
function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonValue;
  }
  return {};
}

function toNullableJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonValue;
  }
  return undefined;
}

/**
 * Creates a Prisma-backed implementation of the DeliveryStore interface.
 * Pass this to createEmailService() instead of passing the PrismaClient directly.
 *
 * @example
 * import { prisma, createPrismaDeliveryStore } from "@creator-suite/db-pg";
 * import { createEmailService } from "@creator-suite/email";
 *
 * const emailService = createEmailService({
 *   store: createPrismaDeliveryStore(prisma),
 *   resendApiKey: "...",
 * });
 */
export function createPrismaDeliveryStore(prisma: PrismaClient): DeliveryStore {
  return {
    /**
     * Inserts a new `EmailDelivery` row with status `queued`.
     *
     * The record is created before the email is sent so that every delivery
     * attempt is persisted even when the Resend API call never completes
     * (e.g. due to a network timeout). The `deliveryKey` column is
     * unique-constrained in the schema, preventing duplicate inserts for the
     * same logical send.
     */
    async create(data: CreateDeliveryInput): Promise<DeliveryRecord> {
      return prisma.emailDelivery.create({
        data: {
          userId: data.userId,
          deliveryKey: data.deliveryKey,
          template: data.template,
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          payload: toJsonValue(data.payload),
          provider: data.provider ?? "resend",
          status: EmailDeliveryStatus.QUEUED,
        },
      }) as Promise<DeliveryRecord>;
    },

    /**
     * Updates an existing delivery record to `SENT`, storing the provider's
     * message ID and the timestamp at which sending was confirmed.
     *
     * `providerMessageId` is Resend's own ID for the message and can be used
     * to look up delivery events in the Resend dashboard.
     */
    async markSent(id: string, providerMessageId: string): Promise<DeliveryRecord> {
      return prisma.emailDelivery.update({
        where: { id },
        data: {
          status: EmailDeliveryStatus.SENT,
          providerMessageId,
          sentAt: new Date(),
        },
      }) as Promise<DeliveryRecord>;
    },

    /**
     * Updates an existing delivery record to `FAILED` and stores the error
     * message for debugging.
     *
     * Called by `sendEmail` inside its `catch` block so that every failed
     * send attempt is recorded and can be queried or retried later.
     */
    async markFailed(id: string, error: string): Promise<DeliveryRecord> {
      return prisma.emailDelivery.update({
        where: { id },
        data: {
          status: EmailDeliveryStatus.FAILED,
          error,
        },
      }) as Promise<DeliveryRecord>;
    },
  };
}

/**
 * Creates a Prisma-backed implementation of the Razorpay payment store.
 * The payments package owns provider workflow logic; this adapter owns the
 * durable PostgreSQL representation.
 */
export function createPrismaRazorpayPaymentStore(
  prisma: PrismaClient,
): RazorpayPaymentStore {
  return {
    async upsertOrder(data: UpsertRazorpayOrderInput) {
      const json = {
        notes: toNullableJsonValue(data.notes),
        rawPayload: toNullableJsonValue(data.rawPayload),
      };

      return prisma.razorpayOrder.upsert({
        where: { razorpayOrderId: data.razorpayOrderId },
        create: {
          userId: data.userId ?? null,
          receipt: data.receipt,
          razorpayOrderId: data.razorpayOrderId,
          amount: data.amount,
          amountPaid: data.amountPaid,
          amountDue: data.amountDue,
          currency: data.currency,
          status: data.status,
          attempts: data.attempts,
          paidAt: data.paidAt ?? null,
          ...(json.notes ? { notes: json.notes } : {}),
          ...(json.rawPayload ? { rawPayload: json.rawPayload } : {}),
        },
        update: {
          receipt: data.receipt,
          amount: data.amount,
          amountPaid: data.amountPaid,
          amountDue: data.amountDue,
          currency: data.currency,
          status: data.status,
          attempts: data.attempts,
          paidAt: data.paidAt ?? undefined,
          ...(data.userId ? { userId: data.userId } : {}),
          ...(json.notes ? { notes: json.notes } : {}),
          ...(json.rawPayload ? { rawPayload: json.rawPayload } : {}),
        },
      }) as Promise<RazorpayOrderRecord>;
    },

    async markOrderPaid(razorpayOrderId: string) {
      const order = await prisma.razorpayOrder.findUnique({
        where: { razorpayOrderId },
      });

      if (!order) {
        return null;
      }

      return prisma.razorpayOrder.update({
        where: { razorpayOrderId },
        data: {
          status: "paid",
          amountPaid: order.amount,
          amountDue: 0,
          paidAt: order.paidAt ?? new Date(),
        },
      }) as Promise<RazorpayOrderRecord>;
    },

    async upsertPayment(data: UpsertRazorpayPaymentInput) {
      const order = data.razorpayOrderId
        ? await prisma.razorpayOrder.findUnique({
          where: { razorpayOrderId: data.razorpayOrderId },
          select: { id: true },
        })
        : null;
      const rawPayload = toNullableJsonValue(data.rawPayload);

      return prisma.razorpayPayment.upsert({
        where: { razorpayPaymentId: data.razorpayPaymentId },
        create: {
          orderId: order?.id ?? null,
          userId: data.userId ?? null,
          razorpayPaymentId: data.razorpayPaymentId,
          razorpayOrderId: data.razorpayOrderId ?? null,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          method: data.method ?? null,
          email: data.email ?? null,
          contact: data.contact ?? null,
          captured: data.captured ?? false,
          refunded: data.refunded ?? false,
          fee: data.fee ?? null,
          tax: data.tax ?? null,
          errorCode: data.errorCode ?? null,
          errorDescription: data.errorDescription ?? null,
          ...(rawPayload ? { rawPayload } : {}),
        },
        update: {
          ...(order ? { orderId: order.id } : {}),
          ...(data.userId ? { userId: data.userId } : {}),
          razorpayOrderId: data.razorpayOrderId ?? undefined,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          method: data.method ?? undefined,
          email: data.email ?? undefined,
          contact: data.contact ?? undefined,
          captured: data.captured ?? false,
          refunded: data.refunded ?? false,
          fee: data.fee ?? undefined,
          tax: data.tax ?? undefined,
          errorCode: data.errorCode ?? undefined,
          errorDescription: data.errorDescription ?? undefined,
          ...(rawPayload ? { rawPayload } : {}),
        },
      }) as Promise<RazorpayPaymentRecord>;
    },

    async upsertPlan(data: UpsertRazorpayPlanInput) {
      const json = {
        notes: toNullableJsonValue(data.notes),
        rawPayload: toNullableJsonValue(data.rawPayload),
      };

      return prisma.razorpayPlan.upsert({
        where: { razorpayPlanId: data.razorpayPlanId },
        create: {
          localKey: data.localKey,
          razorpayPlanId: data.razorpayPlanId,
          name: data.name,
          description: data.description ?? null,
          period: data.period,
          interval: data.interval,
          amount: data.amount,
          currency: data.currency,
          ...(json.notes ? { notes: json.notes } : {}),
          ...(json.rawPayload ? { rawPayload: json.rawPayload } : {}),
        },
        update: {
          localKey: data.localKey,
          name: data.name,
          description: data.description ?? undefined,
          period: data.period,
          interval: data.interval,
          amount: data.amount,
          currency: data.currency,
          ...(json.notes ? { notes: json.notes } : {}),
          ...(json.rawPayload ? { rawPayload: json.rawPayload } : {}),
        },
      }) as Promise<RazorpayPlanRecord>;
    },

    async upsertSubscription(data: UpsertRazorpaySubscriptionInput) {
      const plan = await prisma.razorpayPlan.findUnique({
        where: { razorpayPlanId: data.razorpayPlanId },
        select: { id: true },
      });
      const json = {
        notes: toNullableJsonValue(data.notes),
        rawPayload: toNullableJsonValue(data.rawPayload),
      };

      return prisma.razorpaySubscription.upsert({
        where: { razorpaySubscriptionId: data.razorpaySubscriptionId },
        create: {
          userId: data.userId ?? null,
          planId: plan?.id ?? null,
          razorpaySubscriptionId: data.razorpaySubscriptionId,
          razorpayPlanId: data.razorpayPlanId,
          razorpayCustomerId: data.razorpayCustomerId ?? null,
          customerEmail: data.customerEmail ?? null,
          status: data.status,
          quantity: data.quantity,
          totalCount: data.totalCount ?? null,
          paidCount: data.paidCount ?? null,
          remainingCount: data.remainingCount ?? null,
          currentStart: data.currentStart ?? null,
          currentEnd: data.currentEnd ?? null,
          chargeAt: data.chargeAt ?? null,
          startAt: data.startAt ?? null,
          endAt: data.endAt ?? null,
          endedAt: data.endedAt ?? null,
          shortUrl: data.shortUrl ?? null,
          ...(json.notes ? { notes: json.notes } : {}),
          ...(json.rawPayload ? { rawPayload: json.rawPayload } : {}),
        },
        update: {
          ...(data.userId ? { userId: data.userId } : {}),
          ...(plan ? { planId: plan.id } : {}),
          razorpayPlanId: data.razorpayPlanId,
          razorpayCustomerId: data.razorpayCustomerId ?? undefined,
          customerEmail: data.customerEmail ?? undefined,
          status: data.status,
          quantity: data.quantity,
          totalCount: data.totalCount ?? undefined,
          paidCount: data.paidCount ?? undefined,
          remainingCount: data.remainingCount ?? undefined,
          currentStart: data.currentStart ?? undefined,
          currentEnd: data.currentEnd ?? undefined,
          chargeAt: data.chargeAt ?? undefined,
          startAt: data.startAt ?? undefined,
          endAt: data.endAt ?? undefined,
          endedAt: data.endedAt ?? undefined,
          shortUrl: data.shortUrl ?? undefined,
          ...(json.notes ? { notes: json.notes } : {}),
          ...(json.rawPayload ? { rawPayload: json.rawPayload } : {}),
        },
      }) as Promise<RazorpaySubscriptionRecord>;
    },

    async findWebhookEvent(eventId: string) {
      return prisma.razorpayWebhookEvent.findUnique({
        where: { eventId },
      }) as Promise<RazorpayWebhookEventRecord | null>;
    },

    async createWebhookEvent(data: CreateRazorpayWebhookEventInput) {
      return prisma.razorpayWebhookEvent.create({
        data: {
          eventId: data.eventId,
          eventType: data.eventType,
          signature: data.signature,
          payload: toJsonValue(data.payload),
          status: "processed",
          processedAt: new Date(),
        },
      }) as Promise<RazorpayWebhookEventRecord>;
    },

    async markWebhookEventFailed(eventId: string, error: string) {
      return prisma.razorpayWebhookEvent.update({
        where: { eventId },
        data: {
          status: "failed",
          error,
        },
      }) as Promise<RazorpayWebhookEventRecord>;
    },
  };
}
