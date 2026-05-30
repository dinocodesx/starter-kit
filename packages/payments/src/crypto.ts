import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Generates a unique Razorpay receipt identifier.
 * Receipt is trimmed to 40 chars (Razorpay's limit) and prefixed with "rcpt_".
 */
export function buildReceipt() {
  return `rcpt_${randomUUID().replaceAll("-", "").slice(0, 35)}`;
}

/** Computes an HMAC-SHA256 hex digest of `payload` using `secret`. */
export function createSignature(payload: string | Buffer, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Performs a constant-time comparison of two hex-encoded HMAC strings. */
function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

/**
 * Verifies that the Razorpay-provided `signature` matches the HMAC-SHA256
 * of `payload` computed with `secret`. Throws if the signature is invalid.
 */
export function assertValidSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
) {
  const expectedSignature = createSignature(payload, secret);

  if (!signaturesMatch(expectedSignature, signature)) {
    throw new Error("Invalid Razorpay signature.");
  }
}
