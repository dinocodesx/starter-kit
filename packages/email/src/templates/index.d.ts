export declare const emailTemplates: readonly ["welcome", "upgrade", "trial-ending"];
export type EmailTemplateName = (typeof emailTemplates)[number];
export interface WelcomeEmailTemplateInput {
    appName: string;
    userName?: string | null;
}
export declare function renderWelcomeEmail({ appName, userName, }: WelcomeEmailTemplateInput): {
    subject: string;
    html: string;
    text: string;
};
export declare function renderUpgradeEmail(appName: string, message?: string): {
    subject: string;
    html: string;
    text: string;
};
export declare function renderTrialEndingEmail(appName: string, message?: string): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=index.d.ts.map