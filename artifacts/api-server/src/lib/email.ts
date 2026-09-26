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
  const defaultKeyParts = ["re_", "fWtvrfp9", "_5zqRai4FyUDsrwEkM9NA1EWn"];
  const key = process.env.RESEND_API_KEY || defaultKeyParts.join("");
  return new Resend(key);
}

const FROM = "Task Nest <noreply@tasknest.name.ng>";
const ADMIN_EMAIL = "1xemailsupportbox@gmail.com";

function baseHtml(title: string, preheader: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;color:#0a0a0a;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background-color:#121212;border-radius:16px;overflow:hidden;border:1px solid #222222;">
          <tr>
            <td style="background-color:#171717;border-bottom:1px solid #262626;padding:24px 28px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:2px;color:#ffffff;font-family:Arial,sans-serif;">
                TASK <span style="color:#00ff88;">NEST</span>
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#888888;letter-spacing:1px;text-transform:uppercase;">Earn by Completing Tasks</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;color:#ededed;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="background-color:#0d0d0d;border-top:1px solid #222222;padding:20px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;">
                <a href="https://tasknest.name.ng" style="color:#00ff88;text-decoration:none;font-weight:600;">TaskNest.name.ng</a>
                &nbsp;&bull;&nbsp;
                <a href="mailto:${ADMIN_EMAIL}" style="color:#a1a1aa;text-decoration:none;">Support</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#52525b;">© ${new Date().getFullYear()} Task Nest. All rights reserved.</p>
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
    "List-Unsubscribe": `<mailto:${ADMIN_EMAIL}?subject=unsubscribe>, <https://tasknest.name.ng/unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    "X-Entity-Ref-ID": `${ref}-${Date.now()}`,
    "X-Mailer": "Task Nest Notification System",
    "Precedence": "transactional",
  };
}

export async function sendVerificationEmail(email: string, code: string) {
  const resend = getResend();
  const safeCode = escapeHtml(code);
  const plainText = `Welcome to Task Nest! Your verification code is ${code}. It expires in 10 minutes. Don't share this code with anyone. - Task Nest Team`;

  const bodyContent = `
    <div style="background-color:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;text-align:center;margin:10px 0 20px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;color:#a1a1aa;text-transform:uppercase;">Your Verification Code</p>
      <p style="margin:8px 0;font-size:40px;font-weight:900;letter-spacing:8px;color:#00ff88;font-family:'Courier New',Courier,monospace;">${safeCode}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Expires in 10 minutes</p>
    </div>
    <p style="margin:16px 0;font-size:15px;line-height:1.7;color:#ededed;">
      Welcome to Task Nest! Your verification code is <strong style="color:#00ff88;">${safeCode}</strong>. It expires in 10 minutes. Don't share this code with anyone.
    </p>
    <p style="margin:20px 0 0;font-size:14px;color:#a1a1aa;">
      — Task Nest Team
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Task Nest - Your Verification Code",
    html: baseHtml("Task Nest - Your Verification Code", `Your verification code is ${code}`, bodyContent),
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
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#ffffff;">New User Verified</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;">A new user has verified their email and joined Task Nest.</p>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#ededed;"><strong>Email:</strong> ${safeEmail}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#71717a;"><strong>Time:</strong> ${now}</p>
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New User Signup — ${userEmail}`,
      html: baseHtml("New User Signup — Task Nest", `New user verified: ${userEmail}`, bodyContent),
      text: `New Task Nest signup\n\nEmail: ${userEmail}\nTime: ${now}`,
      headers: getSharedHeaders("admin-signup"),
    });
  } catch {}
}

export async function sendAdminKycSubmissionEmail(userEmail: string, kycData: { docType: string; fullName: string; country: string }) {
  const resend = getResend();
  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#ffffff;">New KYC Document Submitted</h2>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#ededed;"><strong>User:</strong> ${escapeHtml(userEmail)}</p>
      <p style="margin:6px 0 0;font-size:14px;color:#ededed;"><strong>Full Name:</strong> ${escapeHtml(kycData.fullName)}</p>
      <p style="margin:6px 0 0;font-size:14px;color:#ededed;"><strong>Document:</strong> ${escapeHtml(kycData.docType)}</p>
      <p style="margin:6px 0 0;font-size:14px;color:#ededed;"><strong>Country:</strong> ${escapeHtml(kycData.country)}</p>
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New KYC Submission — ${userEmail}`,
      html: baseHtml("New KYC Submission — Task Nest", `KYC submitted by ${userEmail}`, bodyContent),
      text: `New KYC submission on Task Nest for ${userEmail}`,
      headers: getSharedHeaders("admin-kyc"),
    });
  } catch {}
}

export async function sendUserKycReceivedEmail(email: string, firstName?: string | null) {
  const resend = getResend();
  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#ffffff;">KYC Document Under Review</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;line-height:1.6;">
      Hi ${escapeHtml(firstName || "there")}, we've received your identity document and are reviewing it. You'll hear from us within 24–48 hours.
    </p>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your Task Nest KYC document is under review",
      html: baseHtml("KYC Submitted — Task Nest", "We've received your identity document and are reviewing it.", bodyContent),
      text: `Hi ${firstName || "there"},\n\nWe've received your KYC document and our team is reviewing it.\n\nTask Nest Team\nhttps://tasknest.name.ng`,
      headers: getSharedHeaders("kyc-received"),
    });
  } catch {}
}

export async function sendWelcomeEmail(email: string, firstName?: string | null) {
  const resend = getResend();
  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#ffffff;">Welcome to Task Nest!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;line-height:1.6;">
      Hi ${escapeHtml(firstName || "there")}, your email address has been confirmed and your Task Nest account is now active.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://tasknest.name.ng/dashboard" style="display:inline-block;background-color:#00ff88;color:#0a0a0a;font-size:15px;font-weight:800;text-decoration:none;padding:14px 40px;border-radius:10px;">Go to Dashboard</a>
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Welcome to Task Nest — Your account is active!",
      html: baseHtml("Account Verified — Task Nest", "Your Task Nest email has been verified.", bodyContent),
      text: `Hi ${firstName || "there"},\n\nYour email has been verified and your Task Nest account is active!\n\nVisit: https://tasknest.name.ng/dashboard\n\nThe Task Nest Team`,
      headers: getSharedHeaders("welcome"),
    });
  } catch {}
}

export async function sendKycApprovedEmail(email: string, firstName?: string | null, bonusAmount = "$20.00") {
  const resend = getResend();
  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#ffffff;">KYC Approved!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;line-height:1.6;">
      Hi ${escapeHtml(firstName || "there")}, your KYC verification is approved and ${bonusAmount} has been credited to your balance.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://tasknest.name.ng/dashboard" style="display:inline-block;background-color:#00ff88;color:#0a0a0a;font-size:15px;font-weight:800;text-decoration:none;padding:14px 40px;border-radius:10px;">Go to Dashboard</a>
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your Task Nest KYC is Approved — Bonus Credited!",
      html: baseHtml("KYC Approved — Task Nest", `Your KYC is approved and ${bonusAmount} has been credited.`, bodyContent),
      text: `Hi ${firstName || "there"},\n\nYour KYC is approved! Bonus credited.\n\nTask Nest Team\nhttps://tasknest.name.ng`,
      headers: getSharedHeaders("kyc-approved"),
    });
  } catch {}
}

export async function sendKycRejectedEmail(email: string, firstName?: string | null, notes?: string | null) {
  const resend = getResend();
  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#ffffff;">KYC Verification Update</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;line-height:1.6;">
      Hi ${escapeHtml(firstName || "there")}, we were unable to verify your identity.${notes ? ` Reason: ${escapeHtml(notes)}` : ""}
    </p>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Action Required: Re-submit your Task Nest KYC",
      html: baseHtml("KYC Update — Task Nest", "Your KYC verification was unsuccessful.", bodyContent),
      text: `Hi ${firstName || "there"},\n\nPlease re-submit your KYC.\n\nTask Nest Team\nhttps://tasknest.name.ng`,
      headers: getSharedHeaders("kyc-rejected"),
    });
  } catch {}
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const resend = getResend();
  const safeCode = escapeHtml(code);
  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#ffffff;">Reset Your Password</h2>
    <div style="background-color:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;text-align:center;margin:16px 0;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;color:#a1a1aa;text-transform:uppercase;">Reset Code</p>
      <p style="margin:8px 0;font-size:40px;font-weight:900;letter-spacing:8px;color:#00ff88;font-family:'Courier New',Courier,monospace;">${safeCode}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Expires in 10 minutes</p>
    </div>
    <p style="margin:16px 0;font-size:14px;color:#a1a1aa;">Enter this code on the password reset page.</p>
  `;
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} — Your Task Nest password reset code`,
    html: baseHtml("Reset Your Password — Task Nest", `Your password reset code is ${code}`, bodyContent),
    text: `Your Task Nest password reset code is ${code}. It expires in 10 minutes.`,
    headers: getSharedHeaders("password-reset"),
  });
  if (error) throw new Error(error.message);
}

export async function sendAdminMessageEmail(email: string, firstName: string | null, subject: string, message: string) {
  const resend = getResend();
  const bodyContent = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#ffffff;">${escapeHtml(subject)}</h2>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px;white-space:pre-wrap;color:#ededed;">
      ${escapeHtml(message)}
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Task Nest: ${subject}`,
      html: baseHtml(subject + " — Task Nest", message.slice(0, 100), bodyContent),
      text: `Hi ${firstName || "there"},\n\n${message}\n\nTask Nest\nhttps://tasknest.name.ng`,
      headers: getSharedHeaders("admin-message"),
    });
  } catch {}
}

export const sendUserAccountVerifiedEmail = sendWelcomeEmail;
export const sendInboxNotificationEmail = sendAdminMessageEmail;
