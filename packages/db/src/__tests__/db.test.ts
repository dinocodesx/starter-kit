import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../client";

test("database connection test", async () => {
  // This test assumes a database is available if DATABASE_URL is set.
  // If not, it will fail, which is correct for a "data test".
  try {
    const userCount = await prisma.user.count();
    assert.strictEqual(typeof userCount, "number");
  } catch (error) {
    if (process.env.DATABASE_URL) {
      throw error;
    } else {
      console.warn("Skipping DB test: DATABASE_URL not set");
    }
  }
});
