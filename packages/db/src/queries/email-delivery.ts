import type { Prisma, PrismaClient } from "../client";

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
      status: "queued",
    },
  });
}

export async function markEmailDeliverySent(
  prisma: PrismaClient,
  id: string,
  providerMessageId: string,
) {
  return prisma.emailDelivery.update({
    where: { id },
    data: {
      status: "sent",
      providerMessageId,
      sentAt: new Date(),
    },
  });
}

export async function markEmailDeliveryFailed(
  prisma: PrismaClient,
  id: string,
  error: string,
) {
  return prisma.emailDelivery.update({
    where: { id },
    data: {
      status: "failed",
      error,
    },
  });
}
