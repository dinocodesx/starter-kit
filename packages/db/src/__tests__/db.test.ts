import test from "node:test";
import assert from "node:assert/strict";

const hasDb = Boolean(process.env.DATABASE_URL);

test(
  "database connection returns a numeric user count",
  { skip: !hasDb ? "DATABASE_URL not set — skipping live DB test" : false },
  async () => {
    const { prisma } = await import("../client.js");
    const userCount = await prisma.user.count();
    assert.strictEqual(typeof userCount, "number");
    await prisma.$disconnect();
  },
);

test("createPrismaDeliveryStore exposes the required store interface", {
  skip: !hasDb ? "DATABASE_URL not set — skipping live DB test" : false,
}, async () => {
  const { prisma } = await import("../client.js");
  const { createPrismaDeliveryStore } = await import("../store.js");
  assert.strictEqual(typeof createPrismaDeliveryStore, "function");

  const store = createPrismaDeliveryStore(prisma);
  assert.strictEqual(typeof store.create, "function");
  assert.strictEqual(typeof store.markSent, "function");
  assert.strictEqual(typeof store.markFailed, "function");
});
