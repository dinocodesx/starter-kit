import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readRazorpayEnvironment } from "../config.js";
import { createRazorpayPaymentService } from "../workflows.js";
import type {
  RazorpayOrderRecord,
  RazorpayPaymentRecord,
  RazorpayPaymentStore,
  RazorpayPlanRecord,
  RazorpaySubscriptionRecord,
  RazorpayWebhookEventRecord,
} from "../store.js";

function sign(payload: string | Buffer, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

const now = new Date();

function createStore(): RazorpayPaymentStore & { calls: string[] } {
  const calls: string[] = [];
  const webhookEvents = new Map<string, RazorpayWebhookEventRecord>();

  return {
    calls,
    async upsertOrder(input) {
      calls.push("upsertOrder");
      return {
        id: "local_order_1",
        userId: input.userId ?? null,
        receipt: input.receipt,
        razorpayOrderId: input.razorpayOrderId,
        amount: input.amount,
        amountPaid: input.amountPaid,
        amountDue: input.amountDue,
        currency: input.currency,
        status: input.status,
        attempts: input.attempts,
        notes: input.notes ?? null,
        rawPayload: input.rawPayload ?? null,
        paidAt: input.paidAt ?? null,
        createdAt: now,
        updatedAt: now,
      } satisfies RazorpayOrderRecord;
    },
    async markOrderPaid(razorpayOrderId) {
      calls.push("markOrderPaid");
      return {
        id: "local_order_1",
        userId: null,
        receipt: "receipt_1",
        razorpayOrderId,
        amount: 5000,
        amountPaid: 5000,
        amountDue: 0,
        currency: "INR",
        status: "paid",
        attempts: 1,
        notes: null,
        rawPayload: null,
        paidAt: now,
        createdAt: now,
        updatedAt: now,
      } satisfies RazorpayOrderRecord;
    },
    async upsertPayment(input) {
      calls.push("upsertPayment");
      return {
        id: "local_payment_1",
        orderId: "local_order_1",
        userId: input.userId ?? null,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpayOrderId: input.razorpayOrderId ?? null,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        method: input.method ?? null,
        email: input.email ?? null,
        contact: input.contact ?? null,
        captured: input.captured ?? false,
        refunded: input.refunded ?? false,
        fee: input.fee ?? null,
        tax: input.tax ?? null,
        errorCode: input.errorCode ?? null,
        errorDescription: input.errorDescription ?? null,
        rawPayload: input.rawPayload ?? null,
        createdAt: now,
        updatedAt: now,
      } satisfies RazorpayPaymentRecord;
    },
    async upsertPlan(input) {
      calls.push("upsertPlan");
      return {
        id: "local_plan_1",
        localKey: input.localKey,
        razorpayPlanId: input.razorpayPlanId,
        name: input.name,
        description: input.description ?? null,
        period: input.period,
        interval: input.interval,
        amount: input.amount,
        currency: input.currency,
        notes: input.notes ?? null,
        rawPayload: input.rawPayload ?? null,
        createdAt: now,
        updatedAt: now,
      } satisfies RazorpayPlanRecord;
    },
    async upsertSubscription(input) {
      calls.push("upsertSubscription");
      return {
        id: "local_sub_1",
        userId: input.userId ?? null,
        planId: "local_plan_1",
        razorpaySubscriptionId: input.razorpaySubscriptionId,
        razorpayPlanId: input.razorpayPlanId,
        razorpayCustomerId: input.razorpayCustomerId ?? null,
        customerEmail: input.customerEmail ?? null,
        status: input.status,
        quantity: input.quantity,
        totalCount: input.totalCount ?? null,
        paidCount: input.paidCount ?? null,
        remainingCount: input.remainingCount ?? null,
        currentStart: input.currentStart ?? null,
        currentEnd: input.currentEnd ?? null,
        chargeAt: input.chargeAt ?? null,
        startAt: input.startAt ?? null,
        endAt: input.endAt ?? null,
        endedAt: input.endedAt ?? null,
        shortUrl: input.shortUrl ?? null,
        notes: input.notes ?? null,
        rawPayload: input.rawPayload ?? null,
        createdAt: now,
        updatedAt: now,
      } satisfies RazorpaySubscriptionRecord;
    },
    async findWebhookEvent(eventId) {
      calls.push("findWebhookEvent");
      return webhookEvents.get(eventId) ?? null;
    },
    async createWebhookEvent(input) {
      calls.push("createWebhookEvent");
      const event = {
        id: "local_event_1",
        eventId: input.eventId,
        eventType: input.eventType,
        signature: input.signature,
        status: "processed",
        payload: input.payload,
        error: null,
        processedAt: now,
        createdAt: now,
        updatedAt: now,
      } satisfies RazorpayWebhookEventRecord;
      webhookEvents.set(input.eventId, event);
      return event;
    },
    async markWebhookEventFailed(eventId, error) {
      calls.push("markWebhookEventFailed");
      const event = webhookEvents.get(eventId);
      if (!event) {
        throw new Error("Expected webhook event to exist.");
      }
      const failed = { ...event, status: "failed", error };
      webhookEvents.set(eventId, failed);
      return failed;
    },
  };
}

function createService(store = createStore()) {
  return createRazorpayPaymentService({
    store,
    keyId: "rzp_test_key",
    keySecret: "secret",
    webhookSecret: "webhook_secret",
    client: {
      orders: {
        async create(input) {
          return {
            id: "order_1",
            receipt: input.receipt,
            amount: input.amount,
            amount_paid: 0,
            amount_due: input.amount,
            currency: input.currency,
            status: "created",
            attempts: 0,
            notes: input.notes,
          };
        },
      },
      payments: {
        async fetch(paymentId) {
          return {
            id: paymentId,
            order_id: "order_1",
            amount: 5000,
            currency: "INR",
            status: "captured",
            captured: true,
            refunded: false,
            method: "card",
          };
        },
      },
      plans: {
        async create(input) {
          return {
            id: "plan_1",
            period: input.period,
            interval: input.interval,
            item: input.item,
            notes: input.notes,
          };
        },
      },
      subscriptions: {
        async create(input) {
          return {
            id: "sub_1",
            plan_id: input.plan_id,
            status: "created",
            quantity: input.quantity,
            total_count: input.total_count,
            paid_count: 0,
            remaining_count: input.total_count,
            short_url: "https://rzp.io/i/test",
            notes: input.notes,
          };
        },
        async cancel(subscriptionId) {
          return {
            id: subscriptionId,
            plan_id: "plan_1",
            status: "cancelled",
            quantity: 1,
          };
        },
      },
    },
  });
}

test("readRazorpayEnvironment parses valid environment variables", () => {
  const env = readRazorpayEnvironment({
    RAZORPAY_KEY_ID: "key",
    RAZORPAY_KEY_SECRET: "secret",
    RAZORPAY_WEBHOOK_SECRET: "webhook",
  });

  assert.equal(env.keyId, "key");
  assert.equal(env.keySecret, "secret");
  assert.equal(env.webhookSecret, "webhook");
  assert.equal(env.defaultCurrency, "INR");
});

test("readRazorpayEnvironment rejects missing credentials", () => {
  assert.throws(
    () => readRazorpayEnvironment({}),
    /Invalid Razorpay environment configuration/,
  );
});

test("createOrder creates a Razorpay order and stores it", async () => {
  const store = createStore();
  const service = createService(store);
  const order = await service.createOrder({
    amount: 5000,
    receipt: "receipt_1",
    notes: { source: "test" },
  });

  assert.equal(order.keyId, "rzp_test_key");
  assert.equal(order.orderId, "order_1");
  assert.deepEqual(store.calls, ["upsertOrder"]);
});

test("verifyCheckoutPayment accepts valid signatures", async () => {
  const store = createStore();
  const service = createService(store);
  const signature = sign("order_1|pay_1", "secret");
  const result = await service.verifyCheckoutPayment({
    razorpayOrderId: "order_1",
    razorpayPaymentId: "pay_1",
    razorpaySignature: signature,
  });

  assert.equal(result.verified, true);
  assert.equal(result.payment.razorpayPaymentId, "pay_1");
  assert.deepEqual(store.calls, ["upsertPayment", "markOrderPaid"]);
});

test("verifyCheckoutPayment rejects invalid signatures", async () => {
  const service = createService();

  await assert.rejects(
    service.verifyCheckoutPayment({
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_1",
      razorpaySignature: "bad",
    }),
    /Invalid Razorpay signature/,
  );
});

test("handleWebhook validates raw body and deduplicates events", async () => {
  const store = createStore();
  const service = createService(store);
  const rawBody = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_1",
          order_id: "order_1",
          amount: 5000,
          currency: "INR",
          status: "captured",
          captured: true,
          refunded: false,
        },
      },
    },
  });
  const signature = sign(rawBody, "webhook_secret");

  const first = await service.handleWebhook({
    rawBody,
    signature,
    eventId: "evt_1",
  });
  const second = await service.handleWebhook({
    rawBody,
    signature,
    eventId: "evt_1",
  });

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.deepEqual(store.calls, [
    "findWebhookEvent",
    "createWebhookEvent",
    "upsertPayment",
    "findWebhookEvent",
  ]);
});

test("handleWebhook rejects bad webhook signatures", async () => {
  const service = createService();

  await assert.rejects(
    service.handleWebhook({
      rawBody: "{}",
      signature: "bad",
      eventId: "evt_1",
    }),
    /Invalid Razorpay signature/,
  );
});

test("createPlan and createSubscription persist provider responses", async () => {
  const store = createStore();
  const service = createService(store);

  await service.createPlan({
    localKey: "pro-monthly",
    name: "Pro monthly",
    amount: 99900,
    period: "monthly",
  });
  const subscription = await service.createSubscription({
    razorpayPlanId: "plan_1",
    totalCount: 12,
  });

  assert.equal(subscription.subscriptionId, "sub_1");
  assert.deepEqual(store.calls, ["upsertPlan", "upsertSubscription"]);
});
