"use server";

import nodemailer from "nodemailer";

/**
 * Sends an invitation email using nodemailer SMTP.
 */
export async function sendInvitationEmail(
  toEmail: string,
  parentName: string,
  inviteLink: string
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_FROM_ADDRESS;

  if (!host || !port || !user || !pass || !from) {
    throw new Error("SMTP configuration is missing. Please check your environment variables.");
  }

  const emailBody = `Hi there,\n\nYour parent, ${parentName}, has invited you to join Kidoza!\n\nWith Kidoza, you can explore, learn, and chat with your AI buddy.\n\nClick the secure link below to create your account and get started:\n${inviteLink}\n\nThis invitation link will expire in 7 days.\n\nHave fun!\nThe Kidoza Team`;

  const emailHtml = `
    <div style="background-color: #f8fafc; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%; width: 100%; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden; box-sizing: border-box; padding: 32px 24px;">
        
        <!-- Branding Logo Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%); padding: 8px 16px; border-radius: 100px; border: 1px solid #bae6fd; vertical-align: middle;">
            <span style="font-size: 18px; vertical-align: middle; margin-right: 6px;">🚀</span>
            <span style="font-size: 14px; font-weight: 800; color: #0369a1; vertical-align: middle; letter-spacing: 0.05em; text-transform: uppercase;">Kidoza</span>
          </div>
        </div>

        <!-- Main Body -->
        <h2 style="font-size: 20px; font-weight: 900; color: #0f172a; text-align: center; margin: 0 0 16px 0; letter-spacing: -0.02em; line-height: 1.3;">
          Let's Start Your Adventure! ✨
        </h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 12px 0;">
          Hi there!
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
          Your parent, <strong style="color: #0284c7; font-weight: 700;">${parentName}</strong>, has invited you to join <strong style="color: #0f172a;">Kidoza</strong>!
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 12px 16px;">
          With Kidoza, you can ask curious questions, read exciting stories, and complete fun homework challenges with your personal AI learning buddy.
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="${inviteLink}" style="display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 16px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25); border: 1px solid #0284c7; text-align: center; box-sizing: border-box; max-width: 100%;">
            Create Your Account
          </a>
        </div>

        <!-- Expiration Info -->
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 11px; font-weight: 700; color: #b45309; background-color: #fef3c7; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 100px; display: inline-block; text-transform: uppercase; letter-spacing: 0.05em;">
            ⏰ Link Expires in 7 Days
          </span>
        </div>

        <!-- Fallback Link Card -->
        <div style="background-color: #f8fafc; border-radius: 16px; padding: 16px; margin: 24px 0; border: 1px dashed #e2e8f0; text-align: left;">
          <p style="font-size: 12px; font-weight: 700; color: #64748b; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.05em;">
            If the button doesn't work:
          </p>
          <p style="font-size: 12px; line-height: 1.5; color: #475569; margin: 0; word-break: break-all;">
            Copy and paste this secure link into your web browser:<br/>
            <a href="${inviteLink}" style="color: #0284c7; text-decoration: underline; font-weight: 500;">${inviteLink}</a>
          </p>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

        <!-- Footer Signature -->
        <div style="text-align: center;">
          <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin: 0 0 4px 0;">
            Have fun, explorer! 🎈
          </p>
          <p style="font-size: 14px; font-weight: 800; color: #0284c7; margin: 0;">
            The Kidoza Team
          </p>
        </div>
      </div>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: `"Kidoza" <${from}>`,
    to: toEmail,
    subject: `Join Kidoza! Your parent ${parentName} invited you`,
    text: emailBody,
    html: emailHtml,
  });

  console.log(`✉️ Real invitation email successfully sent via SMTP to ${toEmail}`);
}
