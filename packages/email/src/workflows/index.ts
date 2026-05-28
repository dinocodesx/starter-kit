import type { PrismaClient } from "@creator-suite/db";
import {
  createEmailDeliveryRecord,
  markEmailDeliveryFailed,
  markEmailDeliverySent,
} from "@creator-suite/db";
import { randomUUID } from "node:crypto";
import { createResendClient } from "../senders/index.js";
import {
  renderTrialEndingEmail,
  renderUpgradeEmail,
  renderWelcomeEmail,
} from "../templates/index.js";

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

export interface CreateEmailServiceOptions {
  prisma: PrismaClient;
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
  prisma,
  resendApiKey,
  fromAddress = "Onboarding <onboarding@resend.dev>",
  appName = "your workspace",
}: CreateEmailServiceOptions) {
  const resend = resendApiKey ? createResendClient(resendApiKey) : null;

  async function sendEmail(input: SendEmailInput) {
    const recipients = normalizeRecipients(input.to);
    const deliveryKey = input.deliveryKey ?? buildDeliveryKey(input.template);
    const recipientEmail = recipients[0];
    const delivery = await createEmailDeliveryRecord(prisma, {
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
      if (!resend) {
        throw new Error("RESEND_API_KEY is required to send emails.");
      }

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

      await markEmailDeliverySent(prisma, delivery.id, data.id);

      return {
        delivery,
        resendMessageId: data.id,
      };
    } catch (error) {
      await markEmailDeliveryFailed(prisma, delivery.id, stringifyError(error));
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
