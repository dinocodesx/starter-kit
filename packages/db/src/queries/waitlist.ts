import type { PrismaClient, WaitlistEntry } from "../client";

export interface CreateWaitlistEntryInput {
  name: string;
  email: string;
  companyName?: string | null;
  websiteUrl?: string | null;
  stage?: string | null;
  description?: string | null;
  problemSolved?: string | null;
  targetAudience?: string | null;
  willingToPay?: string | null;
  willingToSwitch?: string | null;
}

export type WaitlistStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Creates a new waitlist entry.
 */
export async function createWaitlistEntry(
  prisma: PrismaClient,
  data: CreateWaitlistEntryInput
): Promise<WaitlistEntry> {
  return prisma.waitlistEntry.create({
    data: {
      name: data.name,
      email: data.email,
      companyName: data.companyName,
      websiteUrl: data.websiteUrl,
      stage: data.stage,
      description: data.description,
      problemSolved: data.problemSolved,
      targetAudience: data.targetAudience,
      willingToPay: data.willingToPay,
      willingToSwitch: data.willingToSwitch,
      status: "PENDING",
    },
  });
}

/**
 * Retrieves all waitlist entries.
 */
export async function getWaitlistEntries(prisma: PrismaClient): Promise<WaitlistEntry[]> {
  return prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Updates the status of a waitlist entry.
 */
export async function updateWaitlistStatus(
  prisma: PrismaClient,
  id: string,
  status: WaitlistStatus
): Promise<WaitlistEntry> {
  return prisma.waitlistEntry.update({
    where: { id },
    data: { status },
  });
}
