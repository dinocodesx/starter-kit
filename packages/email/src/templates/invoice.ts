import { escapeHtml } from "./utils";

export interface InvoiceEmailTemplateInput {
  appName: string;
  userName?: string | null;
  invoiceId: string;
  invoiceDate: string;
  amountPaid: string;
  currency: string;
  items: { description: string; amount: string }[];
  receiptUrl?: string;
}

/**
 * Renders the invoice/receipt email sent after a successful payment.
 */
export function renderInvoiceEmail({
  appName,
  userName,
  invoiceId,
  invoiceDate,
  amountPaid,
  currency,
  items,
  receiptUrl,
}: InvoiceEmailTemplateInput) {
  const recipientName = userName?.trim() || "there";

  const itemsHtml = items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid rgba(18, 18, 18, 0.05);">
      <td style="padding: 12px 0; font-size: 15px; color: #424242;">${escapeHtml(item.description)}</td>
      <td style="padding: 12px 0; text-align: right; font-size: 15px; color: #121212;">${escapeHtml(item.amount)}</td>
    </tr>
  `,
    )
    .join("");

  const itemsText = items
    .map((item) => `${item.description}: ${item.amount}`)
    .join("\n");

  return {
    subject: `Receipt for your ${appName} subscription (${invoiceId})`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f7f3ef; color: #121212; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid rgba(18, 18, 18, 0.08);">
          <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6247;">${escapeHtml(appName)} — Receipt</p>
          <h1 style="margin: 0 0 24px; font-size: 32px; line-height: 1.1;">Thanks for your payment, ${escapeHtml(recipientName)}.</h1>
          
          <div style="margin-bottom: 32px; padding: 24px; border-radius: 18px; background: #f5efe7; border: 1px solid rgba(75, 54, 34, 0.1);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 14px; color: #7a6247;">Invoice ID</span>
              <span style="font-size: 14px; font-weight: 500; color: #4b3622;">${escapeHtml(invoiceId)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 14px; color: #7a6247;">Date</span>
              <span style="font-size: 14px; font-weight: 500; color: #4b3622;">${escapeHtml(invoiceDate)}</span>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 2px solid #121212;">
                <th style="text-align: left; padding: 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Description</th>
                <th style="text-align: right; padding: 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 24px 0 0; font-size: 16px; font-weight: 600;">Total Paid</td>
                <td style="padding: 24px 0 0; text-align: right; font-size: 20px; font-weight: 700;">${escapeHtml(currency)}${escapeHtml(amountPaid)}</td>
              </tr>
            </tfoot>
          </table>

          ${
            receiptUrl
              ? `
          <div style="margin-top: 32px; text-align: center;">
            <a href="${receiptUrl}" style="display: inline-block; background: #121212; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 500; font-size: 15px;">Download PDF Receipt</a>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `,
    text: [
      `Receipt for your ${appName} subscription`,
      `Invoice ID: ${invoiceId}`,
      `Date: ${invoiceDate}`,
      "",
      itemsText,
      "",
      `Total Paid: ${currency}${amountPaid}`,
      receiptUrl ? `Download PDF Receipt: ${receiptUrl}` : "",
    ].filter(Boolean).join("\n"),
  };
}
