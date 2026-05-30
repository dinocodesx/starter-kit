import type { DeliveryRecord, DeliveryStore } from "../store";
import { randomUUID } from "node:crypto";
import { createResendClient } from "../senders/index";
import {
  renderTrialEndingEmail,
  renderUpgradeEmail,
  renderWelcomeEmail,
  renderLoginEmail,
  renderLogoutEmail,
  renderChangelogEmail,
  renderInvoiceEmail,
  type AuthEmailTemplateInput,
  type ChangelogEmailTemplateInput,
  type InvoiceEmailTemplateInput,
} from "../templates/index";

export interface EmailRecipient {
  email: string;
  userId?: string | null;
  name?: string | null;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  template: string;
  userId?: string | null;
  payload?: Record<string, unknown>;
  deliveryKey?: string;
  from?: string;
}

export interface SendEmailResult {
  delivery: DeliveryRecord;
  resendMessageId: string;
}

export interface EmailService {
  sendEmail: (input: SendEmailInput) => Promise<SendEmailResult>;
  sendWelcomeEmail: (recipient: EmailRecipient) => Promise<SendEmailResult>;
  sendUpgradeEmail: (input: UpgradeEmailInput) => Promise<SendEmailResult>;
  sendTrialEndingEmail: (input: TrialEndingEmailInput) => Promise<SendEmailResult>;
  sendLoginEmail: (
    recipient: EmailRecipient,
    data: Omit<AuthEmailTemplateInput, "appName" | "userName">,
  ) => Promise<SendEmailResult>;
  sendLogoutEmail: (
    recipient: EmailRecipient,
    data: Omit<AuthEmailTemplateInput, "appName" | "userName" | "location" | "device">,
  ) => Promise<SendEmailResult>;
  sendChangelogEmail: (
    recipient: string | string[],
    data: Omit<ChangelogEmailTemplateInput, "appName">,
  ) => Promise<SendEmailResult>;
  sendInvoiceEmail: (
    recipient: EmailRecipient,
    data: Omit<InvoiceEmailTemplateInput, "appName" | "userName">,
  ) => Promise<SendEmailResult>;
}

export interface UpgradeEmailInput extends EmailRecipient {
  message?: string;
}

export interface TrialEndingEmailInput extends EmailRecipient {
  message?: string;
}

export interface CreateEmailServiceOptions {
  store: DeliveryStore;
  resendApiKey: string;
  fromAddress?: string;
  appName?: string;
}

/**
 * Normalises the `to` field on an outgoing email to an array of strings.
 *
 * Resend's SDK accepts either a single address or an array; internally the
 * service always works with an array so that multi-recipient sends and
 * single-recipient sends are handled by the same code path.
 */
function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

/**
 * Generates a unique delivery key for a given template name.
 *
 * The key is stored on the `EmailDelivery` record and used by the database's
 * `@unique` constraint to prevent duplicate deliveries for the same logical
 * send. The UUID suffix makes every auto-generated key globally unique while
 * still being human-readable (e.g. `"welcome:4f2a…"`).
 *
 * Callers may supply their own `deliveryKey` via `SendEmailInput.deliveryKey`
 * to control idempotency manually (e.g. for scheduled retry logic).
 */
function buildDeliveryKey(template: string) {
  return `${template}:${randomUUID()}`;
}

/**
 * Converts an unknown thrown value to a human-readable string for storage in
 * the `error` column of the `EmailDelivery` record.
 *
 * Handles the three common shapes of thrown values:
 * - `Error` instances  → uses `.message`
 * - plain strings      → used as-is
 * - anything else      → JSON-serialised, or `"Unknown email delivery error"`
 *   if serialisation itself throws (e.g. for circular objects).
 */
function stringifyError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown email delivery error";
  }
}

/**
 * Creates and returns an `EmailService` bound to the given configuration.
 *
 * The service wires together three concerns:
 * 1. **Delivery tracking** — every outgoing email is logged to the `DeliveryStore`
 *    before the Resend API call is made. The record is then updated to `sent`
 *    on success or `failed` on error.
 * 2. **Sending** — uses the Resend SDK to deliver the email.
 * 3. **Idempotency** — the `deliveryKey` on each record is unique-constrained in
 *    the database, so retrying a request with the same key is safe.
 *
 * Throws immediately if `resendApiKey` is empty, so misconfigured environments
 * are caught at startup.
 */
export function createEmailService({
  store,
  resendApiKey,
  fromAddress = "Onboarding <onboarding@resend.dev>",
  appName = "your workspace",
}: CreateEmailServiceOptions): EmailService {
  if (!resendApiKey) {
    throw new Error(
      "resendApiKey is required to create the email service. Set RESEND_API_KEY in your environment.",
    );
  }

  const resend = createResendClient(resendApiKey);

  /**
   * Core send function used by all higher-level helpers.
   *
   * Workflow:
   * 1. Validates that at least one recipient address was provided.
   * 2. Creates a `DeliveryRecord` with status `queued` so the attempt is
   *    persisted even if the Resend call never completes.
   * 3. Sends the email via Resend.
   * 4. On success, marks the record as `sent` and stores Resend's message ID.
   * 5. On any error, marks the record as `failed` (with the error message)
   *    and re-throws so the caller can handle or propagate it.
   */
  async function sendEmail(input: SendEmailInput) {
    const recipients = normalizeRecipients(input.to);
    const recipientEmail = recipients[0];

    if (!recipientEmail) {
      throw new Error("At least one recipient is required to send an email.");
    }

    const deliveryKey = input.deliveryKey ?? buildDeliveryKey(input.template);
    const delivery = await store.create({
      userId: input.userId ?? null,
      deliveryKey,
      template: input.template,
      recipientEmail,
      subject: input.subject,
      payload: {
        ...input.payload,
        recipients,
        from: input.from ?? fromAddress,
      },
    });

    try {
      const { data, error } = await resend.emails.send({
        from: input.from ?? fromAddress,
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      if (error || !data?.id) {
        throw new Error(
          stringifyError(error ?? new Error("Resend did not return an email id.")),
        );
      }

      const updatedDelivery = await store.markSent(delivery.id, data.id);

      return {
        delivery: updatedDelivery,
        resendMessageId: data.id,
      };
    } catch (error) {
      await store.markFailed(delivery.id, stringifyError(error));
      throw error;
    }
  }

  /**
   * Sends the welcome email to a newly created user.
   *
   * Renders the `welcome` template with the user's name and the configured
   * `appName`, then delegates to `sendEmail` for delivery tracking and sending.
   * Falls back to `"there"` if `recipient.name` is null or blank.
   */
  async function sendWelcomeEmail(recipient: EmailRecipient) {
    const template = renderWelcomeEmail({
      appName,
      userName: recipient.name,
    });

    return sendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: "welcome",
      userId: recipient.userId ?? null,
      payload: {
        appName,
        userName: recipient.name,
      },
    });
  }

  /**
   * Sends the upgrade confirmation email to a user after their workspace plan
   * has been upgraded.
   *
   * `input.message` is optional; if omitted the template supplies a sensible
   * default. The `userId` on the input is forwarded to the delivery record for
   * traceability.
   */
  async function sendUpgradeEmail(input: UpgradeEmailInput) {
    const template = renderUpgradeEmail(
      appName,
      input.message ?? "Your workspace has been upgraded.",
    );

    return sendEmail({
      to: input.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: "upgrade",
      userId: input.userId ?? null,
      payload: {
        appName,
        message: input.message,
      },
    });
  }

  /**
   * Sends the trial-ending reminder email to a user whose free trial is about
   * to expire.
   *
   * `input.message` is optional and can carry dynamic copy such as the exact
   * expiry date. Falls back to the template's default if omitted.
   */
  async function sendTrialEndingEmail(input: TrialEndingEmailInput) {
    const template = renderTrialEndingEmail(
      appName,
      input.message ?? "Your trial is ending soon.",
    );

    return sendEmail({
      to: input.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: "trial-ending",
      userId: input.userId ?? null,
      payload: {
        appName,
        message: input.message,
      },
    });
  }

  /**
   * Sends a login notification email.
   */
  async function sendLoginEmail(
    recipient: EmailRecipient,
    data: Omit<AuthEmailTemplateInput, "appName" | "userName">,
  ) {
    const template = renderLoginEmail({
      appName,
      userName: recipient.name,
      ...data,
    });

    return sendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: "login",
      userId: recipient.userId ?? null,
      payload: {
        appName,
        userName: recipient.name,
        ...data,
      },
    });
  }

  /**
   * Sends a logout notification email.
   */
  async function sendLogoutEmail(
    recipient: EmailRecipient,
    data: Omit<AuthEmailTemplateInput, "appName" | "userName" | "location" | "device">,
  ) {
    const template = renderLogoutEmail({
      appName,
      userName: recipient.name,
      ...data,
    });

    return sendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: "logout",
      userId: recipient.userId ?? null,
      payload: {
        appName,
        userName: recipient.name,
        ...data,
      },
    });
  }

  /**
   * Sends a changelog or product update email.
   *
   * Accepts multiple recipients.
   */
  async function sendChangelogEmail(
    recipient: string | string[],
    data: Omit<ChangelogEmailTemplateInput, "appName">,
  ) {
    const template = renderChangelogEmail({
      appName,
      ...data,
    });

    return sendEmail({
      to: recipient,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: "changelog",
      payload: {
        appName,
        ...data,
      },
    });
  }

  /**
   * Sends an invoice/receipt email after a successful payment.
   */
  async function sendInvoiceEmail(
    recipient: EmailRecipient,
    data: Omit<InvoiceEmailTemplateInput, "appName" | "userName">,
  ) {
    const template = renderInvoiceEmail({
      appName,
      userName: recipient.name,
      ...data,
    });

    return sendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: "invoice",
      userId: recipient.userId ?? null,
      payload: {
        appName,
        userName: recipient.name,
        ...data,
      },
    });
  }

  return {
    sendEmail,
    sendWelcomeEmail,
    sendUpgradeEmail,
    sendTrialEndingEmail,
    sendLoginEmail,
    sendLogoutEmail,
    sendChangelogEmail,
    sendInvoiceEmail,
  };
}
