import type { PrismaClient } from "@creator-suite/db";
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
export declare function createEmailService({ prisma, resendApiKey, fromAddress, appName, }: CreateEmailServiceOptions): {
    sendEmail: (input: SendEmailInput) => Promise<{
        delivery: {
            error: string | null;
            id: string;
            provider: string;
            deliveryKey: string;
            template: string;
            recipientEmail: string;
            subject: string;
            payload: import("@prisma/client/runtime/client").JsonValue | null;
            providerMessageId: string | null;
            status: import("@creator-suite/db/src/generated/prisma/enums.js").EmailDeliveryStatus;
            sentAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
        };
        resendMessageId: string;
    }>;
    sendWelcomeEmail: (recipient: EmailRecipient) => Promise<{
        delivery: {
            error: string | null;
            id: string;
            provider: string;
            deliveryKey: string;
            template: string;
            recipientEmail: string;
            subject: string;
            payload: import("@prisma/client/runtime/client").JsonValue | null;
            providerMessageId: string | null;
            status: import("@creator-suite/db/src/generated/prisma/enums.js").EmailDeliveryStatus;
            sentAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
        };
        resendMessageId: string;
    }>;
    sendUpgradeEmail: (message: string, to: string | string[]) => Promise<{
        delivery: {
            error: string | null;
            id: string;
            provider: string;
            deliveryKey: string;
            template: string;
            recipientEmail: string;
            subject: string;
            payload: import("@prisma/client/runtime/client").JsonValue | null;
            providerMessageId: string | null;
            status: import("@creator-suite/db/src/generated/prisma/enums.js").EmailDeliveryStatus;
            sentAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
        };
        resendMessageId: string;
    }>;
    sendTrialEndingEmail: (message: string, to: string | string[]) => Promise<{
        delivery: {
            error: string | null;
            id: string;
            provider: string;
            deliveryKey: string;
            template: string;
            recipientEmail: string;
            subject: string;
            payload: import("@prisma/client/runtime/client").JsonValue | null;
            providerMessageId: string | null;
            status: import("@creator-suite/db/src/generated/prisma/enums.js").EmailDeliveryStatus;
            sentAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
        };
        resendMessageId: string;
    }>;
};
//# sourceMappingURL=index.d.ts.map