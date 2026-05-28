import type { EmailDeliveryStatus, Prisma, PrismaClient } from "../client";

/**
 * Inserts a new `EmailDelivery` row with status `queued`.
 *
 * This is the low-level query used when a send attempt begins. It persists
 * the record before the provider API is called so that every attempt is
 * tracked even if the network call never completes. `deliveryKey` must be
 * unique — the schema enforces this with a `@unique` constraint so duplicate
 * inserts are rejected at the database level.
 */
export async function createEmailDeliveryRecord(
  prisma: PrismaClient,
  data: {
    userId: string | null;
    deliveryKey: string;
    template: string;
    recipientEmail: string;
    subject: string;
    payload?: Prisma.InputJsonValue;
    provider?: string;
  },
) {
  return prisma.emailDelivery.create({
    data: {
      userId: data.userId,
      deliveryKey: data.deliveryKey,
      template: data.template,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      payload: data.payload ?? {},
      provider: data.provider ?? "resend",
      status: "queued" as EmailDeliveryStatus,
    },
  });
}

/**
 * Marks an existing delivery record as `sent` and records the provider's
 * message ID and the time the send was confirmed.
 *
 * `providerMessageId` is the ID returned by Resend (or whichever email
 * provider is in use) and can be used to look up delivery events and webhooks
 * in the provider dashboard.
 */
export async function markEmailDeliverySent(
  prisma: PrismaClient,
  id: string,
  providerMessageId: string,
) {
  return prisma.emailDelivery.update({
    where: { id },
    data: {
      status: "sent" as EmailDeliveryStatus,
      providerMessageId,
      sentAt: new Date(),
    },
  });
}

/**
 * Marks an existing delivery record as `failed` and stores the error message
 * for debugging and potential retry logic.
 *
 * Called after a send attempt throws so that the failure is visible in the
 * delivery log and can be queried (e.g. to build a failed-sends dashboard or
 * to trigger automated retries).
 */
export async function markEmailDeliveryFailed(
  prisma: PrismaClient,
  id: string,
  error: string,
) {
  return prisma.emailDelivery.update({
    where: { id },
    data: {
      status: "failed" as EmailDeliveryStatus,
      error,
    },
  });
}
