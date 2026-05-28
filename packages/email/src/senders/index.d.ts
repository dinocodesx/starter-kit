import { Resend } from "resend";
export declare const mailerProviders: readonly ["resend"];
export type MailerProvider = (typeof mailerProviders)[number];
export declare function getMailerProvider(): "resend";
export declare function createResendClient(apiKey: string): Resend;
//# sourceMappingURL=index.d.ts.map