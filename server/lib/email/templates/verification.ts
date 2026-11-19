import { renderBaseEmailLayout } from "./base-layout";

export interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
}

export function renderVerificationEmailTemplate({
  userName,
  verificationUrl,
}: VerificationEmailProps) {
  const subject = "Verify Your Email Address - KomikHQ";
  const previewText = `Hello ${userName}, please verify your email address to activate your KomikHQ account.`;

  const contentHtml = `
    <h1 style="color: #f4f4f5; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.35; letter-spacing: -0.02em;">
      Verify Your KomikHQ Account
    </h1>
    <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Hello <strong style="color: #fafafa;">${userName}</strong>,
    </p>
    <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
      Thank you for joining KomikHQ! To secure your account and access all comic reading features, please click the button below to verify your email address:
    </p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius: 8px; background-color: #ea580c;">
                <a href="${verificationUrl}" target="_blank" style="background-color: #ea580c; border: 1px solid #ea580c; border-radius: 8px; color: #ffffff; display: inline-block; font-size: 15px; font-weight: 600; padding: 14px 32px; text-decoration: none; text-align: center;">
                  Verify Email
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <hr style="border: none; border-top: 1px solid #27272a; margin: 28px 0;" />
    <p style="font-size: 13px; color: #71717a; margin: 0 0 8px 0; line-height: 1.5;">
      If the button above does not work, copy and paste the following URL into your browser:
    </p>
    <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 12px 14px; margin: 0 0 20px 0; word-break: break-all;">
      <a href="${verificationUrl}" target="_blank" style="color: #ea580c; font-size: 13px; text-decoration: none; line-height: 1.4;">${verificationUrl}</a>
    </div>
  `.trim();

  const html = renderBaseEmailLayout({
    title: subject,
    previewText,
    contentHtml,
  });

  const text = `Hello ${userName},\n\nThank you for signing up for KomikHQ.\nPlease click the following link to verify your email address:\n${verificationUrl}\n\nIf you did not sign up for KomikHQ, you can safely ignore this email.`;

  return { subject, html, text };
}
