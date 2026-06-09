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

const FROM = "Gold Mailer <noreply@goldmailer.xyz>";

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
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111111;">Welcome to Gold Mailer!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.7;">
      You're one step away from joining thousands of investors earning guaranteed returns on our global staking platform.
      Please confirm your email address using the code below.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:24px 0;">
          <div style="display:inline-block;background-color:#fefce8;border:2px solid #f5c518;border-radius:12px;padding:24px 48px;text-align:center;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;color:#92400e;text-transform:uppercase;">Your Verification Code</p>
            <p style="margin:10px 0 0;font-size:42px;font-weight:900;letter-spacing:10px;color:#1a1a1a;font-family:Courier,monospace;">${safeCode}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#b45309;">Expires in 20 minutes</p>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:4px 0 16px;font-size:13px;color:#666666;line-height:1.6;">
      Enter this code on the verification page to activate your account. This code was sent to <strong style="color:#333;">${safeEmail}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;margin:20px 0;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#333;letter-spacing:0.5px;">What you get with Gold Mailer:</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#555;">&#9733; Stake funds and earn guaranteed profit in 7 days</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#555;">&#9733; Claim daily rewards of up to &#8358;100 per active stake</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#555;">&#9733; Earn referral bonuses for every friend you invite</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#555;">&#9733; Get a &#8358;3,000 signup bonus when you add your card</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 6px;font-size:12px;color:#999999;line-height:1.6;">
      If you did not create a Gold Mailer account, you can safely ignore this email — no action is needed on your part.
    </p>
    <p style="margin:0;font-size:12px;color:#999999;">
      Need help? Contact us at <a href="mailto:1xemailsupportbox@gmail.com" style="color:#f5c518;text-decoration:none;">1xemailsupportbox@gmail.com</a>
    </p>
  `;

  const plainText = `Welcome to Gold Mailer!

You're one step away from joining thousands of investors earning guaranteed returns.

Your email verification code is: ${code}

This code expires in 20 minutes. Enter it on the verification page to activate your account.

What you get with Gold Mailer:
- Stake funds and earn guaranteed profit in 7 days
- Claim daily rewards per active stake
- Earn referral bonuses for every friend you invite
- Get a signup bonus when you add your card

If you did not create a Gold Mailer account, please ignore this email.

Need help? Contact: 1xemailsupportbox@gmail.com

© ${new Date().getFullYear()} Gold Mailer Ltd. — goldmailer.xyz
Lagos, Nigeria | Available in NG, US, UK, CA`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Confirm your Gold Mailer account — ${code}`,
    html: baseHtml("Welcome to Gold Mailer — Confirm Your Email", `Welcome! Your verification code is ${code}. Enter it to activate your account and start earning.`, bodyContent),
    text: plainText,
    headers: {
      "List-Unsubscribe": "<mailto:1xemailsupportbox@gmail.com?subject=unsubscribe>",
      "X-Entity-Ref-ID": `verify-${Date.now()}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

const ADMIN_EMAIL = "1xemailsupportbox@gmail.com";

export async function sendAdminNewSignupEmail(userEmail: string) {
  const resend = getResend();
  const safeEmail = escapeHtml(userEmail);
  const now = new Date().toUTCString();

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">New User Signup</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      A new user has verified their email and joined Gold Mailer.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border:1px solid #e4e4e7;border-radius:8px;padding:0;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">User Email</p>
        <p style="margin:0;font-size:16px;font-weight:800;color:#111;">${safeEmail}</p>
      </td></tr>
      <tr><td style="padding:0 20px 16px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Signed Up At</p>
        <p style="margin:0;font-size:14px;color:#333;">${escapeHtml(now)}</p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#888;">Log in to the admin panel to manage this account.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New signup: ${userEmail}`,
      html: baseHtml("New User Signup — Gold Mailer", `New user verified: ${userEmail}`, bodyContent),
      text: `New Gold Mailer signup\n\nEmail: ${userEmail}\nTime: ${now}`,
    });
  } catch (_) {}
}

export async function sendAdminKycSubmissionEmail(userEmail: string, idType: string) {
  const resend = getResend();
  const safeEmail = escapeHtml(userEmail);
  const idTypeLabel = idType === "nin" ? "NIN" : idType === "voters_card" ? "Voter's Card" : "Passport";
  const now = new Date().toUTCString();

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">New KYC Submission</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      A user has submitted their ID for KYC verification. Please review it in the admin panel.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border:1px solid #e4e4e7;border-radius:8px;padding:0;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">User</p>
        <p style="margin:0;font-size:16px;font-weight:800;color:#111;">${safeEmail}</p>
      </td></tr>
      <tr><td style="padding:0 20px 16px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">ID Type</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#f5c518;">${escapeHtml(idTypeLabel)}</p>
      </td></tr>
      <tr><td style="padding:0 20px 16px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Submitted At</p>
        <p style="margin:0;font-size:14px;color:#333;">${escapeHtml(now)}</p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#888;">Go to the admin panel → KYC tab to approve or decline.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `KYC submitted by ${userEmail} (${idTypeLabel})`,
      html: baseHtml("New KYC Submission — Gold Mailer", `KYC submitted by ${userEmail}`, bodyContent),
      text: `New KYC Submission\n\nUser: ${userEmail}\nID Type: ${idTypeLabel}\nTime: ${now}\n\nReview in admin panel.`,
    });
  } catch (_) {}
}

export async function sendUserKycApprovedEmail(userEmail: string, firstName: string | null, bonusAmount: string) {
  const resend = getResend();
  const safeName = escapeHtml(firstName || "there");
  const safeBonus = escapeHtml(bonusAmount);

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">Your KYC is Approved!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Hi ${safeName}, great news! Your identity has been verified and your account is now fully active.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:20px 0;">
          <div style="display:inline-block;background-color:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:2px;color:#16a34a;text-transform:uppercase;">Bonus Credited</p>
            <p style="margin:10px 0 0;font-size:36px;font-weight:900;color:#15803d;">${safeBonus}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#16a34a;">added to your balance</p>
          </div>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 8px;font-size:15px;color:#444444;line-height:1.6;">
      You can now stake, deposit, withdraw, and access all platform features. Log in to get started!
    </p>
    <p style="margin:0;font-size:13px;color:#888888;">Thank you for verifying your identity. Your account is secure.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: "Your Gold Mailer KYC is Approved — Bonus Credited!",
      html: baseHtml("KYC Approved — Gold Mailer", `Your KYC is approved and ${bonusAmount} has been credited to your account.`, bodyContent),
      text: `Your Gold Mailer KYC is Approved!\n\nHi ${firstName || "there"},\n\nYour identity has been verified and ${bonusAmount} has been credited to your account.\n\nLog in to start staking and earning!\n\n© ${new Date().getFullYear()} Gold Mailer — goldmailer.xyz`,
    });
  } catch (_) {}
}

export async function sendUserKycDeclinedEmail(userEmail: string, firstName: string | null, notes?: string | null) {
  const resend = getResend();
  const safeName = escapeHtml(firstName || "there");
  const safeNotes = notes ? escapeHtml(notes) : null;

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">KYC Verification Update</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Hi ${safeName}, unfortunately we were unable to verify your identity with the document submitted.
    </p>
    ${safeNotes ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7f7;border:1px solid #fecaca;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:1px;">Reason</p>
        <p style="margin:0;font-size:14px;color:#333;">${safeNotes}</p>
      </td></tr>
    </table>` : ""}
    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6;">
      Please log in and re-submit your ID with a clearer photo. Make sure the document is fully visible, well-lit, and not blurry.
    </p>
    <p style="margin:0;font-size:13px;color:#888888;">If you need help, contact our support team.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: "Action Required: Re-submit your Gold Mailer KYC",
      html: baseHtml("KYC Update — Gold Mailer", "Your KYC verification was unsuccessful. Please re-submit.", bodyContent),
      text: `KYC Verification Update\n\nHi ${firstName || "there"},\n\nWe were unable to verify your identity.${notes ? `\n\nReason: ${notes}` : ""}\n\nPlease log in and re-submit a clearer photo of your ID.\n\n© ${new Date().getFullYear()} Gold Mailer — goldmailer.xyz`,
    });
  } catch (_) {}
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
