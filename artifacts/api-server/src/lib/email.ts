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

const FROM = "GoldMailer <noreply@goldmailer.xyz>";
const ADMIN_EMAIL = "1xemailsupportbox@gmail.com";

function baseHtml(title: string, preheader: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;color:#f4f4f5;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">

          <tr>
            <td style="background-color:#1a1a2e;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:4px;color:#f5c518;font-family:Arial,sans-serif;">GOLDMAILER</p>
              <p style="margin:6px 0 0;font-size:12px;color:#a0a0b0;">The Global Staking Platform</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                <a href="https://goldmailer.xyz" style="color:#f5c518;text-decoration:none;font-weight:600;">goldmailer.xyz</a>
                &nbsp;&bull;&nbsp;
                <a href="mailto:${ADMIN_EMAIL}" style="color:#9ca3af;text-decoration:none;">Support</a>
                &nbsp;&bull;&nbsp;
                <a href="https://goldmailer.xyz/unsubscribe" style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} GoldMailer. All rights reserved.</p>
              <p style="margin:4px 0 0;font-size:10px;color:#d1d5db;">This email was sent because of account activity on goldmailer.xyz. If you did not request this, you can safely ignore it.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getSharedHeaders(ref: string) {
  return {
    "List-Unsubscribe": `<mailto:${ADMIN_EMAIL}?subject=unsubscribe>, <https://goldmailer.xyz/unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    "X-Entity-Ref-ID": `${ref}-${Date.now()}`,
    "X-Mailer": "GoldMailer Notification System",
    "Precedence": "transactional",
  };
}

export async function sendVerificationEmail(email: string, code: string) {
  const resend = getResend();
  const safeEmail = escapeHtml(email);
  const safeCode = escapeHtml(code);

  const bodyContent = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111111;font-family:Arial,sans-serif;">Confirm your email address</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.7;">
      You're one step away from joining thousands of investors earning guaranteed returns.
      Enter the code below on the verification page to activate your account.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:24px 0;">
          <div style="display:inline-block;background-color:#fefce8;border:2px solid #f5c518;border-radius:12px;padding:24px 48px;text-align:center;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;color:#92400e;text-transform:uppercase;">Your Verification Code</p>
            <p style="margin:10px 0 0;font-size:42px;font-weight:900;letter-spacing:10px;color:#1a1a1a;font-family:'Courier New',Courier,monospace;">${safeCode}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#b45309;">Expires in 20 minutes</p>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:4px 0 16px;font-size:13px;color:#666666;line-height:1.6;">
      This code was sent to <strong style="color:#333;">${safeEmail}</strong>. Do not share it with anyone.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;margin:20px 0;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#333;letter-spacing:0.5px;">What you get with GoldMailer:</p>
          <p style="margin:4px 0;font-size:13px;color:#555;">&#9733; Stake funds and earn guaranteed profit in 7 days</p>
          <p style="margin:4px 0;font-size:13px;color:#555;">&#9733; Claim daily rewards on every active stake</p>
          <p style="margin:4px 0;font-size:13px;color:#555;">&#9733; Earn referral bonuses for every friend you invite</p>
          <p style="margin:4px 0;font-size:13px;color:#555;">&#9733; Get a signup bonus when you complete verification</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;">
      If you did not create a GoldMailer account, you can safely ignore this email — no action is needed.
    </p>
  `;

  const plainText = `GoldMailer — Verify Your Email

Your verification code is: ${code}

This code expires in 20 minutes. Enter it on the verification page to activate your account.

Do NOT share this code with anyone. GoldMailer will never ask for your code.

If you did not create an account, ignore this email.

Support: ${ADMIN_EMAIL}
goldmailer.xyz`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} — Your GoldMailer verification code`,
    html: baseHtml("Verify Your Email — GoldMailer", `Your GoldMailer verification code is ${code}. Enter it to activate your account.`, bodyContent),
    text: plainText,
    headers: getSharedHeaders("verify"),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendAdminNewSignupEmail(userEmail: string) {
  const resend = getResend();
  const safeEmail = escapeHtml(userEmail);
  const now = new Date().toUTCString();

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">New User Signup</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      A new user has verified their email and joined GoldMailer.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:20px;">
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
      html: baseHtml("New User Signup — GoldMailer", `New user verified: ${userEmail}`, bodyContent),
      text: `New GoldMailer signup\n\nEmail: ${userEmail}\nTime: ${now}`,
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:20px;">
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
      html: baseHtml("New KYC Submission — GoldMailer", `KYC submitted by ${userEmail}`, bodyContent),
      text: `New KYC Submission\n\nUser: ${userEmail}\nID Type: ${idTypeLabel}\nTime: ${now}\n\nReview in admin panel.`,
    });
  } catch (_) {}
}

export async function sendUserKycSubmittedEmail(userEmail: string, firstName: string | null) {
  const resend = getResend();
  const safeName = escapeHtml(firstName || "there");

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">Your KYC is Under Review</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Hi ${safeName}, we've received your identity document and our team is reviewing it now.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:20px 0;">
          <div style="display:inline-block;background-color:#eff6ff;border:2px solid #3b82f6;border-radius:12px;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:1px;color:#1d4ed8;text-transform:uppercase;">Review Timeline</p>
            <p style="margin:8px 0 0;font-size:28px;font-weight:900;color:#1e3a8a;">24–48 Hours</p>
            <p style="margin:6px 0 0;font-size:13px;color:#3b82f6;">We'll email you the result</p>
          </div>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:20px 0;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;">What happens next:</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">1. Our admin team reviews your document</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">2. You receive an email with the result</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">3. If approved, your $20 bonus is instantly credited</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">4. Full platform access is unlocked</p>
      </td></tr>
    </table>

    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">&#9888; Important reminder</p>
      <p style="margin:6px 0 0;font-size:13px;color:#78350f;">Make sure your bank card name matches your ID exactly. Mismatches may delay approval.</p>
    </div>

    <p style="margin:0;font-size:13px;color:#9ca3af;">If you have any questions, contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:#f5c518;text-decoration:none;">${ADMIN_EMAIL}</a></p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: "Your GoldMailer KYC document is under review",
      html: baseHtml("KYC Submitted — GoldMailer", "We've received your identity document and are reviewing it. You'll hear from us within 24–48 hours.", bodyContent),
      text: `Hi ${firstName || "there"},\n\nWe've received your KYC document and our team is reviewing it.\n\nExpected review time: 24–48 hours\n\nYou'll receive an email once reviewed. If approved, your $20 bonus will be credited instantly.\n\nQuestions? Contact: ${ADMIN_EMAIL}\n\ngoldmailer.xyz`,
      headers: getSharedHeaders("kyc-submitted"),
    });
  } catch (_) {}
}

export async function sendUserAccountVerifiedEmail(userEmail: string, firstName: string | null) {
  const resend = getResend();
  const safeName = escapeHtml(firstName || "there");

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">Email Verified Successfully!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Hi ${safeName}, your email address has been confirmed and your GoldMailer account is now active.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:16px 0;">
          <div style="display:inline-block;background-color:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:32px;">&#10003;</p>
            <p style="margin:8px 0 0;font-size:16px;font-weight:800;color:#15803d;">Account Active</p>
          </div>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:20px 0;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;">Next steps to get started:</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">&#8594; Complete your profile (name, phone, country)</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">&#8594; Nigerian users: complete KYC to unlock all features + $20 bonus</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">&#8594; Make your first deposit to start staking</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">&#8594; Earn profit in as little as 7 days</p>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:8px 0 20px;">
          <a href="https://goldmailer.xyz/dashboard" style="display:inline-block;background-color:#f5c518;color:#1a1a1a;font-size:15px;font-weight:800;text-decoration:none;padding:14px 40px;border-radius:10px;">Go to Dashboard</a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#9ca3af;">Welcome to the GoldMailer family! Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:#f5c518;text-decoration:none;">Contact support</a></p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: "Welcome to GoldMailer — Your account is active!",
      html: baseHtml("Account Verified — GoldMailer", "Your GoldMailer email has been verified. Your account is now active and ready to use.", bodyContent),
      text: `Hi ${firstName || "there"},\n\nYour email has been verified and your GoldMailer account is now active!\n\nNext steps:\n- Complete your profile\n- Nigerian users: complete KYC to unlock all features + $20 bonus\n- Make your first deposit and start staking\n\nVisit: https://goldmailer.xyz/dashboard\n\nWelcome aboard!\nThe GoldMailer Team`,
      headers: getSharedHeaders("account-verified"),
    });
  } catch (_) {}
}

export async function sendUserKycApprovedEmail(userEmail: string, firstName: string | null, bonusAmount: string) {
  const resend = getResend();
  const safeName = escapeHtml(firstName || "there");
  const safeBonus = escapeHtml(bonusAmount);

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">Your KYC is Approved! &#127881;</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Hi ${safeName}, great news! Your identity has been verified and your account is now fully active.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:8px 0 20px;">
          <a href="https://goldmailer.xyz/dashboard" style="display:inline-block;background-color:#f5c518;color:#1a1a1a;font-size:15px;font-weight:800;text-decoration:none;padding:14px 40px;border-radius:10px;">Go to Dashboard</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#888888;">Thank you for verifying your identity. Your account is secure and fully unlocked.</p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: "Your GoldMailer KYC is Approved — Bonus Credited!",
      html: baseHtml("KYC Approved — GoldMailer", `Your KYC is approved and ${bonusAmount} has been credited to your account.`, bodyContent),
      text: `Your GoldMailer KYC is Approved!\n\nHi ${firstName || "there"},\n\nYour identity has been verified and ${bonusAmount} has been credited to your account.\n\nLog in to start staking and earning:\nhttps://goldmailer.xyz/dashboard\n\n© ${new Date().getFullYear()} GoldMailer — goldmailer.xyz`,
      headers: getSharedHeaders("kyc-approved"),
    });
  } catch (_) {}
}

export async function sendUserKycDeclinedEmail(userEmail: string, firstName: string | null, notes?: string | null) {
  const resend = getResend();
  const safeName = escapeHtml(firstName || "there");
  const safeNotes = notes ? escapeHtml(notes) : null;

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">Action Required: KYC Verification</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Hi ${safeName}, unfortunately we were unable to verify your identity with the document submitted.
    </p>
    ${safeNotes ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7f7;border:1px solid #fecaca;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:1px;">Reason</p>
        <p style="margin:0;font-size:14px;color:#333;">${safeNotes}</p>
      </td></tr>
    </table>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:0 0 20px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;">Common reasons for decline:</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">&#10006; Blurry or dark photo — use good lighting</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">&#10006; Name mismatch — ID name must match account name</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">&#10006; Document partially cut off — show the full document</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">&#10006; Expired document — use a valid, current ID</p>
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:8px 0 20px;">
          <a href="https://goldmailer.xyz/kyc" style="display:inline-block;background-color:#ef4444;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:14px 40px;border-radius:10px;">Re-submit KYC</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#888888;">If you need help, contact our support team at <a href="mailto:${ADMIN_EMAIL}" style="color:#f5c518;text-decoration:none;">${ADMIN_EMAIL}</a></p>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: "Action Required: Re-submit your GoldMailer KYC",
      html: baseHtml("KYC Update — GoldMailer", "Your KYC verification was unsuccessful. Please re-submit with a clearer photo.", bodyContent),
      text: `KYC Verification Update\n\nHi ${firstName || "there"},\n\nWe were unable to verify your identity.${notes ? `\n\nReason: ${notes}` : ""}\n\nPlease log in and re-submit a clearer photo of your ID.\n\nhttps://goldmailer.xyz/kyc\n\n© ${new Date().getFullYear()} GoldMailer — goldmailer.xyz`,
      headers: getSharedHeaders("kyc-declined"),
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

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:20px 0;">
          <div style="display:inline-block;background-color:#f9f9f9;border:2px solid #f5c518;border-radius:10px;padding:20px 40px;">
            <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;color:#888888;text-transform:uppercase;">Reset Code</p>
            <p style="margin:8px 0 0;font-size:38px;font-weight:900;letter-spacing:10px;color:#111111;font-family:'Courier New',Courier,monospace;">${safeCode}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#888;">Expires in 20 minutes</p>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:20px 0 8px;font-size:13px;color:#666666;line-height:1.6;">
      Enter this code on the reset page, then choose a new password.
    </p>
    <p style="margin:0;font-size:13px;color:#888888;">If you did not request a password reset, no action is required — your account is still secure.</p>
  `;

  const plainText = `GoldMailer — Password Reset

Your password reset code is: ${code}

This code expires in 20 minutes.

If you did not request a password reset, please ignore this email. Your account remains secure.

goldmailer.xyz`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} — Your GoldMailer password reset code`,
    html: baseHtml("Reset Your Password — GoldMailer", `Your password reset code is ${code}. It expires in 20 minutes.`, bodyContent),
    text: plainText,
    headers: getSharedHeaders("reset"),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendInboxNotificationEmail(
  userEmail: string,
  firstName: string | null,
  subject: string,
  message: string,
) {
  const resend = getResend();
  const safeName = escapeHtml(firstName || "there");
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const safeSubject = escapeHtml(subject);

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;">${safeSubject}</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">Hi ${safeName},</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin:0 0 20px;font-size:14px;color:#374151;line-height:1.8;">
      ${safeMessage}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:8px 0 20px;">
          <a href="https://goldmailer.xyz/inbox" style="display:inline-block;background-color:#f5c518;color:#1a1a1a;font-size:15px;font-weight:800;text-decoration:none;padding:14px 40px;border-radius:10px;">View in Inbox</a>
        </td>
      </tr>
    </table>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: `GoldMailer: ${subject}`,
      html: baseHtml(subject + " — GoldMailer", message.slice(0, 100), bodyContent),
      text: `Hi ${firstName || "there"},\n\n${message}\n\nView your inbox: https://goldmailer.xyz/inbox\n\ngoldmailer.xyz`,
      headers: getSharedHeaders("inbox"),
    });
  } catch (_) {}
}
