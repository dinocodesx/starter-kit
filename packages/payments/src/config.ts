export interface RazorpayEnvironment {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  defaultCurrency: string;
}

export function readRazorpayEnvironment(
  env: Record<string, string | undefined> = process.env,
): RazorpayEnvironment {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET?.trim();
  const defaultCurrency = env.RAZORPAY_DEFAULT_CURRENCY?.trim() || "INR";

  const missing = [
    !keyId ? "RAZORPAY_KEY_ID" : null,
    !keySecret ? "RAZORPAY_KEY_SECRET" : null,
    !webhookSecret ? "RAZORPAY_WEBHOOK_SECRET" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Invalid Razorpay environment configuration. Missing: ${missing.join(", ")}.`,
    );
  }

  return {
    keyId: keyId as string,
    keySecret: keySecret as string,
    webhookSecret: webhookSecret as string,
    defaultCurrency,
  };
}
