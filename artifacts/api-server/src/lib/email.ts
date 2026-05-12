import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Gold Mailer <noreply@mail.goldmailer.xyz>";

export async function sendVerificationEmail(email: string, code: string) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your Gold Mailer account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #f5c518; font-size: 28px; margin: 0;">GOLDMAILER</h1>
          <p style="color: #888; margin: 8px 0 0;">Your trusted staking platform</p>
        </div>
        <h2 style="color: #fff; font-size: 20px;">Verify Your Email Address</h2>
        <p style="color: #bbb; line-height: 1.6;">Thank you for registering with Gold Mailer. Use the verification code below to activate your account:</p>
        <div style="background: #1a1a1a; border: 1px solid #f5c518; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; color: #f5c518; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #888; font-size: 14px;">This code expires in <strong style="color: #f5c518;">20 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border: 1px solid #222; margin: 32px 0;" />
        <p style="color: #555; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Gold Mailer. All rights reserved.</p>
      </div>
    `,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Gold Mailer password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #f5c518; font-size: 28px; margin: 0;">GOLDMAILER</h1>
          <p style="color: #888; margin: 8px 0 0;">Your trusted staking platform</p>
        </div>
        <h2 style="color: #fff; font-size: 20px;">Password Reset Request</h2>
        <p style="color: #bbb; line-height: 1.6;">We received a request to reset your Gold Mailer password. Use the code below:</p>
        <div style="background: #1a1a1a; border: 1px solid #f5c518; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; color: #f5c518; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #888; font-size: 14px;">This code expires in <strong style="color: #f5c518;">20 minutes</strong>. If you did not request a reset, ignore this email.</p>
        <hr style="border: 1px solid #222; margin: 32px 0;" />
        <p style="color: #555; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Gold Mailer. All rights reserved.</p>
      </div>
    `,
  });
  if (error) {
    throw new Error(error.message);
  }
}
