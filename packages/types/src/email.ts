/**
 * Shared email delivery types.
 *
 * Consumed by:
 *   - @creator-suite/email  (service layer)
 *   - @creator-suite/db-pg  (Prisma-backed store implementation)
 *
 * Defined here to avoid a circular dependency between those two packages.
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
