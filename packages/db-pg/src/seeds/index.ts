import { prisma, EmailDeliveryStatus } from "../client";

/**
 * Seeds the database with a minimal, consistent set of development fixtures.
 *
 * All inserts use `upsert` so the function is idempotent — running it multiple
 * times against the same database is safe and will not create duplicate rows.
 *
 * What gets seeded:
 * - **4 Users** — one admin and three named users, each with a unique email.
 * - **4 Sessions** — one 7-day session token per user.
 * - **4 Accounts** — one Google OAuth account per user.
 * - **4 Verification records** — one email-verification code per user slot,
 *   valid for 24 hours.
 * - **4 EmailDelivery records** — one `SENT` welcome-email delivery log per
 *   user, matching the template name and subject used in production.
 */
export async function seed() {
  console.log("Seeding database...");

  // 1. Seed 4 Users
  const users = [
    { email: "admin@example.com", name: "Admin User" },
    { email: "jane@example.com", name: "Jane Doe" },
    { email: "john@example.com", name: "John Smith" },
    { email: "alice@example.com", name: "Alice Wonderland" },
  ];

  const seededUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    seededUsers.push(user);
    console.log("Seeded user:", user.email);
  }

  // 2. Seed 4 Sessions (1 for each user)
  for (const user of seededUsers) {
    await prisma.session.upsert({
      where: { token: `token_${user.id}` },
      update: {},
      create: {
        userId: user.id,
        token: `token_${user.id}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });
    console.log("Seeded session for user:", user.email);
  }

  // 3. Seed 4 Accounts (1 for each user)
  for (const user of seededUsers) {
    await prisma.account.upsert({
      where: {
        providerId_accountId: {
          providerId: "google",
          accountId: `google_${user.id}`,
        },
      },
      update: {},
      create: {
        userId: user.id,
        providerId: "google",
        accountId: `google_${user.id}`,
      },
    });
    console.log("Seeded account for user:", user.email);
  }

  // 4. Seed 4 Verification records
  for (let i = 1; i <= 4; i++) {
    await prisma.verification.upsert({
      where: {
        identifier_value: {
          identifier: `user_${i}@example.com`,
          value: `vcode_${i}`,
        },
      },
      update: {},
      create: {
        identifier: `user_${i}@example.com`,
        value: `vcode_${i}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      },
    });
    console.log(`Seeded verification record ${i}`);
  }

  // 5. Seed 4 EmailDeliveries (1 for each user)
  for (const user of seededUsers) {
    await prisma.emailDelivery.upsert({
      where: { deliveryKey: `delivery_${user.id}` },
      update: {},
      create: {
        userId: user.id,
        deliveryKey: `delivery_${user.id}`,
        template: "welcome",
        recipientEmail: user.email,
        subject: "Welcome to Smolive",
        status: EmailDeliveryStatus.SENT,
      },
    });
    console.log("Seeded email delivery for user:", user.email);
  }

  console.log("Seeding finished.");
}
