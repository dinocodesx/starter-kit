import type { DeliveryRecord, DeliveryStore } from "../store";
import { randomUUID } from "node:crypto";
import { createResendClient } from "../senders/index";
import {
  renderTrialEndingEmail,
  renderUpgradeEmail,
  renderWelcomeEmail,
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
  sendUpgradeEmail: (
    message: string,
    to: string | string[],
  ) => Promise<SendEmailResult>;
  sendTrialEndingEmail: (
    message: string,
    to: string | string[],
  ) => Promise<SendEmailResult>;
}

export interface CreateEmailServiceOptions {
  store: DeliveryStore;
  resendApiKey: string;
  fromAddress?: string;
  appName?: string;
}

function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

function buildDeliveryKey(template: string) {
  return `${template}:${randomUUID()}`;
}

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

  async function sendUpgradeEmail(message: string, to: string | string[]) {
    const template = renderUpgradeEmail(appName, message);

    return sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: "upgrade",
      payload: {
        appName,
        message,
      },
    });
  }

  async function sendTrialEndingEmail(message: string, to: string | string[]) {
    const template = renderTrialEndingEmail(appName, message);

    return sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: "trial-ending",
      payload: {
        appName,
        message,
      },
    });
  }

  return {
    sendEmail,
    sendWelcomeEmail,
    sendUpgradeEmail,
    sendTrialEndingEmail,
  };
}
