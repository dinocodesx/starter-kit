import { Resend } from "resend";
export const mailerProviders = ["resend"];
export function getMailerProvider() {
    return "resend";
}
export function createResendClient(apiKey) {
    if (!apiKey) {
        throw new Error("RESEND_API_KEY is required to create the Resend client.");
    }
    return new Resend(apiKey);
}
