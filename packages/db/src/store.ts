import type { PrismaClient } from "./client";

/**
 * Local shape matching @creator-suite/email's DeliveryRecord interface.
 * Defined here to avoid a circular dependency (db → email).
 * TypeScript's structural typing ensures this is compatible at the call site.
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
    async create(data: CreateDeliveryInput): Promise<DeliveryRecord> {
      return prisma.emailDelivery.create({
        data: {
          userId: data.userId,
          deliveryKey: data.deliveryKey,
          template: data.template,
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          payload: (data.payload as object) ?? {},
          provider: data.provider ?? "resend",
          status: "queued",
        },
      }) as Promise<DeliveryRecord>;
    },

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
