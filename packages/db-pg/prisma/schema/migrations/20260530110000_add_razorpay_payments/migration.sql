-- CreateTable
CREATE TABLE "razorpay_order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "receipt" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "amountDue" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "notes" JSONB,
    "rawPayload" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "razorpay_payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "userId" TEXT,
    "razorpayPaymentId" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "method" TEXT,
    "email" TEXT,
    "contact" TEXT,
    "captured" BOOLEAN NOT NULL DEFAULT false,
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "fee" INTEGER,
    "tax" INTEGER,
    "errorCode" TEXT,
    "errorDescription" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "razorpay_plan" (
    "id" TEXT NOT NULL,
    "localKey" TEXT NOT NULL,
    "razorpayPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "period" TEXT NOT NULL,
    "interval" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "notes" JSONB,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "razorpay_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "planId" TEXT,
    "razorpaySubscriptionId" TEXT NOT NULL,
    "razorpayPlanId" TEXT NOT NULL,
    "razorpayCustomerId" TEXT,
    "customerEmail" TEXT,
    "status" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalCount" INTEGER,
    "paidCount" INTEGER,
    "remainingCount" INTEGER,
    "currentStart" TIMESTAMP(3),
    "currentEnd" TIMESTAMP(3),
    "chargeAt" TIMESTAMP(3),
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "shortUrl" TEXT,
    "notes" JSONB,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "razorpay_webhook_event" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_order_receipt_key" ON "razorpay_order"("receipt");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_order_razorpayOrderId_key" ON "razorpay_order"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "razorpay_order_userId_idx" ON "razorpay_order"("userId");

-- CreateIndex
CREATE INDEX "razorpay_order_status_idx" ON "razorpay_order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_payment_razorpayPaymentId_key" ON "razorpay_payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "razorpay_payment_orderId_idx" ON "razorpay_payment"("orderId");

-- CreateIndex
CREATE INDEX "razorpay_payment_userId_idx" ON "razorpay_payment"("userId");

-- CreateIndex
CREATE INDEX "razorpay_payment_razorpayOrderId_idx" ON "razorpay_payment"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "razorpay_payment_status_idx" ON "razorpay_payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_plan_localKey_key" ON "razorpay_plan"("localKey");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_plan_razorpayPlanId_key" ON "razorpay_plan"("razorpayPlanId");

-- CreateIndex
CREATE INDEX "razorpay_plan_period_idx" ON "razorpay_plan"("period");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_subscription_razorpaySubscriptionId_key" ON "razorpay_subscription"("razorpaySubscriptionId");

-- CreateIndex
CREATE INDEX "razorpay_subscription_userId_idx" ON "razorpay_subscription"("userId");

-- CreateIndex
CREATE INDEX "razorpay_subscription_planId_idx" ON "razorpay_subscription"("planId");

-- CreateIndex
CREATE INDEX "razorpay_subscription_razorpayPlanId_idx" ON "razorpay_subscription"("razorpayPlanId");

-- CreateIndex
CREATE INDEX "razorpay_subscription_status_idx" ON "razorpay_subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_webhook_event_eventId_key" ON "razorpay_webhook_event"("eventId");

-- CreateIndex
CREATE INDEX "razorpay_webhook_event_eventType_idx" ON "razorpay_webhook_event"("eventType");

-- CreateIndex
CREATE INDEX "razorpay_webhook_event_status_idx" ON "razorpay_webhook_event"("status");

-- AddForeignKey
ALTER TABLE "razorpay_order" ADD CONSTRAINT "razorpay_order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "razorpay_payment" ADD CONSTRAINT "razorpay_payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "razorpay_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "razorpay_payment" ADD CONSTRAINT "razorpay_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "razorpay_subscription" ADD CONSTRAINT "razorpay_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "razorpay_subscription" ADD CONSTRAINT "razorpay_subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "razorpay_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
