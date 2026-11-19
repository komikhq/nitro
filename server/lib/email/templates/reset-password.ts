import { renderBaseEmailLayout } from "./base-layout";

export interface ResetPasswordEmailProps {
  userName: string;
  resetUrl: string;
}

export function renderResetPasswordEmailTemplate({
  userName,
  resetUrl,
}: ResetPasswordEmailProps) {
  const subject = "Reset Password - KomikHQ";
  const previewText = `Hello ${userName}, use this link to reset your KomikHQ account password.`;

  const contentHtml = `
    <h1 style="color: #f4f4f5; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.35; letter-spacing: -0.02em;">
      Reset Password
    </h1>
    <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Hello <strong style="color: #fafafa;">${userName}</strong>,
    </p>
    <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
      We received a request to reset your KomikHQ account password. Click the button below to set a new password:
    </p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 28px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius: 8px; background-color: #ea580c;">
                <a href="${resetUrl}" target="_blank" style="background-color: #ea580c; border: 1px solid #ea580c; border-radius: 8px; color: #ffffff; display: inline-block; font-size: 15px; font-weight: 600; padding: 14px 32px; text-decoration: none; text-align: center;">
                  Reset Password
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="background-color: rgba(234, 88, 12, 0.08); border: 1px solid rgba(234, 88, 12, 0.25); border-radius: 8px; padding: 14px 16px; margin: 24px 0;">
      <p style="color: #fdba74; font-size: 13px; line-height: 1.5; margin: 0;">
        <strong>Security Notice:</strong> This link is only valid for a limited time. Never share this link with anyone.
      </p>
    </div>
    <hr style="border: none; border-top: 1px solid #27272a; margin: 28px 0;" />
    <p style="font-size: 13px; color: #71717a; margin: 0 0 8px 0; line-height: 1.5;">
      If the button above does not work, copy and paste the following URL into your browser:
    </p>
    <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 12px 14px; margin: 0 0 20px 0; word-break: break-all;">
      <a href="${resetUrl}" target="_blank" style="color: #ea580c; font-size: 13px; text-decoration: none; line-height: 1.4;">${resetUrl}</a>
    </div>
  `.trim();

  const html = renderBaseEmailLayout({
    title: subject,
    previewText,
    contentHtml,
  });

  const text = `Hello ${userName},\n\nWe received a request to reset your KomikHQ account password.\nPlease use the following link to create a new password:\n${resetUrl}\n\nThis link is confidential and valid for a limited time only. If you did not request a password reset, you can safely ignore this email.`;

  return { subject, html, text };
}
