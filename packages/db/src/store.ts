import type { PrismaClient, Prisma } from "./client";

/**
 * Local shape matching @creator-suite/email's DeliveryRecord interface.
 * Defined here to avoid a circular dependency (db → email).
 * TypeScript's structural typing ensures this is compatible at the call site.
 *
 * Keep in sync with DeliveryRecord in packages/email/src/store.ts.
 */
interface DeliveryRecord {
  id: string;
  userId: string | null;
  provider: string;
  deliveryKey: string;
  template: string;
  recipientEmail: string;
  subject: string;
  payload: unknown;
  providerMessageId: string | null;
  status: string;
  error: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateDeliveryInput {
  userId: string | null;
  deliveryKey: string;
  template: string;
  recipientEmail: string;
  subject: string;
  payload?: unknown;
  provider?: string;
}

interface DeliveryStore {
  create(data: CreateDeliveryInput): Promise<DeliveryRecord>;
  markSent(id: string, providerMessageId: string): Promise<DeliveryRecord>;
  markFailed(id: string, error: string): Promise<DeliveryRecord>;
}

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

/**
 * Creates a Prisma-backed implementation of the DeliveryStore interface.
 * Pass this to createEmailService() instead of passing the PrismaClient directly.
 *
 * @example
 * import { prisma, createPrismaDeliveryStore } from "@creator-suite/db";
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
          status: "queued",
        },
      }) as Promise<DeliveryRecord>;
    },

    /**
     * Updates an existing delivery record to `sent`, storing the provider's
     * message ID and the timestamp at which sending was confirmed.
     *
     * `providerMessageId` is Resend's own ID for the message and can be used
     * to look up delivery events in the Resend dashboard.
     */
    async markSent(id: string, providerMessageId: string): Promise<DeliveryRecord> {
      return prisma.emailDelivery.update({
        where: { id },
        data: {
          status: "sent",
          providerMessageId,
          sentAt: new Date(),
        },
      }) as Promise<DeliveryRecord>;
    },

    /**
     * Updates an existing delivery record to `failed` and stores the error
     * message for debugging.
     *
     * Called by `sendEmail` inside its `catch` block so that every failed
     * send attempt is recorded and can be queried or retried later.
     */
    async markFailed(id: string, error: string): Promise<DeliveryRecord> {
      return prisma.emailDelivery.update({
        where: { id },
        data: {
          status: "failed",
          error,
        },
      }) as Promise<DeliveryRecord>;
    },
  };
}
