/**
 * Abstraction layer for email delivery persistence.
 *
 * The canonical type definitions live in @creator-suite/types so that
 * @creator-suite/db-pg can implement the same interfaces without creating a
 * circular dependency between the email and db-pg packages.
 *
 * This file re-exports them for backward compatibility — existing imports
 * from @creator-suite/email continue to work unchanged.
 */
export type { DeliveryRecord, CreateDeliveryInput, DeliveryStore } from "@creator-suite/types";
