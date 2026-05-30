import type { RazorpayJson } from "./store";

/** A raw response entity returned by the Razorpay REST API. */
export type RazorpayEntity = Record<string, unknown>;

/**
 * Minimal Razorpay SDK surface the service depends on.
 * Abstracted as an interface so the real Razorpay client can be swapped
 * for a test double without importing the SDK in tests.
 */
export interface RazorpayClient {
  orders: {
    create(input: RazorpayJson): Promise<RazorpayEntity>;
  };
  payments: {
    fetch(paymentId: string): Promise<RazorpayEntity>;
  };
  plans: {
    create(input: RazorpayJson): Promise<RazorpayEntity>;
  };
  subscriptions: {
    create(input: RazorpayJson): Promise<RazorpayEntity>;
    cancel(subscriptionId: string, input?: RazorpayJson): Promise<RazorpayEntity>;
  };
}
