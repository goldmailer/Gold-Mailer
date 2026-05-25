import { Resend } from "resend";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set. Email sending is unavailable.");
  }
  return new Resend(key);
}

const FROM = "Gold Mailer <noreply@mail.goldmailer.xyz>";

function baseHtml(title: string, preheader: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <!-- preheader text (hidden) -->
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a1a2e;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:4px;color:#f5c518;">GOLDMAILER</p>
              <p style="margin:6px 0 0;font-size:12px;color:#a0a0b0;">The Global Staking Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#a0a0a0;">© ${new Date().getFullYear()} Gold Mailer. All rights reserved.</p>
              <p style="margin:6px 0 0;font-size:11px;color:#a0a0a0;">This email was sent because an account action was performed on goldmailer.xyz</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, code: string) {
  const resend = getResend();
  const safeEmail = escapeHtml(email);
  const safeCode = escapeHtml(code);

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">Confirm your email address</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Thanks for signing up with Gold Mailer. Enter the code below to confirm your email address and activate your account.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:20px 0;">
          <div style="display:inline-block;background-color:#f9f9f9;border:2px solid #f5c518;border-radius:10px;padding:20px 40px;">
            <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;color:#888888;text-transform:uppercase;">Verification Code</p>
            <p style="margin:8px 0 0;font-size:38px;font-weight:900;letter-spacing:10px;color:#111111;">${safeCode}</p>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:20px 0 8px;font-size:13px;color:#666666;line-height:1.6;">
      This code was sent to <strong>${safeEmail}</strong>. It expires in <strong>20 minutes</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:#888888;">If you did not create a Gold Mailer account, you can safely ignore this email.</p>
  `;

  const plainText = `GOLDMAILER — Confirm Your Email

Your verification code is: ${code}

This code expires in 20 minutes.

If you did not sign up for a Gold Mailer account, please ignore this email.

© ${new Date().getFullYear()} Gold Mailer — goldmailer.xyz`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} is your Gold Mailer verification code`,
    html: baseHtml("Confirm your email — Gold Mailer", `Your verification code is ${code}. It expires in 20 minutes.`, bodyContent),
    text: plainText,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const resend = getResend();
  const safeEmail = escapeHtml(email);
  const safeCode = escapeHtml(code);

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">Reset your password</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      We received a request to reset the password for <strong>${safeEmail}</strong>. Use the code below to set a new password.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:20px 0;">
          <div style="display:inline-block;background-color:#f9f9f9;border:2px solid #f5c518;border-radius:10px;padding:20px 40px;">
            <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;color:#888888;text-transform:uppercase;">Reset Code</p>
            <p style="margin:8px 0 0;font-size:38px;font-weight:900;letter-spacing:10px;color:#111111;">${safeCode}</p>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:20px 0 8px;font-size:13px;color:#666666;line-height:1.6;">
      This code expires in <strong>20 minutes</strong>. After entering it, you will be prompted to choose a new password.
    </p>
    <p style="margin:0;font-size:13px;color:#888888;">If you did not request a password reset, no action is required. Your account is still secure.</p>
  `;

  const plainText = `GOLDMAILER — Password Reset

Your password reset code is: ${code}

This code expires in 20 minutes.

If you did not request a password reset for your Gold Mailer account, please ignore this email. Your account remains secure.

© ${new Date().getFullYear()} Gold Mailer — goldmailer.xyz`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} is your Gold Mailer password reset code`,
    html: baseHtml("Reset your password — Gold Mailer", `Your password reset code is ${code}. It expires in 20 minutes.`, bodyContent),
    text: plainText,
  });

  if (error) {
    throw new Error(error.message);
  }
}
