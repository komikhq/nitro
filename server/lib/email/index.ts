import type { H3Event } from "nitro/h3";
import { useCloudflareEnv } from "@/server/utils/cloudflare";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(
  options: SendEmailOptions,
  event?: H3Event,
): Promise<boolean> {
  const env = event ? useCloudflareEnv(event) : ((globalThis as any).__env__ || (process.env as any));
  const provider = env?.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER || "resend";
  const from = env?.EMAIL_FROM || process.env.EMAIL_FROM || "KomikHQ <no-reply@komikhq.com>";

  switch (provider.toLowerCase()) {
    case "resend": {
      const apiKey = env?.RESEND_API_KEY || process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error("Missing RESEND_API_KEY environment variable.");
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Resend API dispatch failed: ${errText}`);
      }
      return true;
    }

    case "brevo": {
      const apiKey = env?.BREVO_API_KEY || process.env.BREVO_API_KEY;
      if (!apiKey) {
        throw new Error("Missing BREVO_API_KEY environment variable.");
      }
      const senderEmail = from.includes("<") ? from.split("<")[1].replace(">", "").trim() : from;
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: { email: senderEmail, name: "KomikHQ" },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Brevo API dispatch failed: ${errText}`);
      }
      return true;
    }

    default:
      throw new Error(`Unsupported EMAIL_PROVIDER: "${provider}".`);
  }
}
