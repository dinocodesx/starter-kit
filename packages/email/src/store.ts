/**
 * Abstraction layer for email delivery persistence.
 * The email package depends on this interface, not on Prisma directly.
 * The concrete Prisma-backed implementation lives in @creator-suite/db.
 */

export interface DeliveryRecord {
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

export interface CreateDeliveryInput {
  userId: string | null;
  deliveryKey: string;
  template: string;
  recipientEmail: string;
  subject: string;
  payload?: unknown;
  provider?: string;
}

export interface DeliveryStore {
  create(data: CreateDeliveryInput): Promise<DeliveryRecord>;
  markSent(id: string, providerMessageId: string): Promise<DeliveryRecord>;
  markFailed(id: string, error: string): Promise<DeliveryRecord>;
}
