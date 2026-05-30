import test from "node:test";
import assert from "node:assert/strict";

const hasDb = Boolean(process.env.DATABASE_URL);

test(
  "database connection returns a numeric user count",
  { skip: !hasDb ? "DATABASE_URL not set — skipping live DB test" : false },
  async () => {
    const { prisma } = await import("../client");
    const userCount = await prisma.user.count();
    assert.strictEqual(typeof userCount, "number");
    await prisma.$disconnect();
  },
);

test("createPrismaDeliveryStore exposes the required store interface", {
  skip: !hasDb ? "DATABASE_URL not set — skipping live DB test" : false,
}, async () => {
  const { prisma } = await import("../client");
  const { createPrismaDeliveryStore } = await import("../store");
  assert.strictEqual(typeof createPrismaDeliveryStore, "function");

  const store = createPrismaDeliveryStore(prisma);
  assert.strictEqual(typeof store.create, "function");
  assert.strictEqual(typeof store.markSent, "function");
  assert.strictEqual(typeof store.markFailed, "function");
});

test("createPrismaRazorpayPaymentStore exposes the required store interface", {
  skip: !hasDb ? "DATABASE_URL not set — skipping live DB test" : false,
}, async () => {
  const { prisma } = await import("../client");
  const { createPrismaRazorpayPaymentStore } = await import("../store");
  assert.strictEqual(typeof createPrismaRazorpayPaymentStore, "function");

  const store = createPrismaRazorpayPaymentStore(prisma);
  assert.strictEqual(typeof store.upsertOrder, "function");
  assert.strictEqual(typeof store.markOrderPaid, "function");
  assert.strictEqual(typeof store.upsertPayment, "function");
  assert.strictEqual(typeof store.upsertPlan, "function");
  assert.strictEqual(typeof store.upsertSubscription, "function");
  assert.strictEqual(typeof store.findWebhookEvent, "function");
  assert.strictEqual(typeof store.createWebhookEvent, "function");
  assert.strictEqual(typeof store.markWebhookEventFailed, "function");
});
