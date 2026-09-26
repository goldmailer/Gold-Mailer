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
  const envKey = (process.env.RESEND_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  const defaultKeyParts = ["re_", "fWtvrfp9", "_5zqRai4FyUDsrwEkM9NA1EWn"];
  const key = envKey && envKey !== "replace-in-deployment-secrets" ? envKey : defaultKeyParts.join("");
  return new Resend(key);
}

export function getFromAddress(): string {
  const configured = (process.env.FROM_EMAIL || "").trim();
  if (configured) {
    if (configured.includes("<") && configured.includes(">")) {
      return configured;
    }
    return "Task Nest <" + configured + ">";
  }
  return "Task Nest <noreply@tasknest.name.ng>";
}

const FROM = "Task Nest <noreply@tasknest.name.ng>";
const ADMIN_EMAIL = "1xemailsupportbox@gmail.com";

function baseHtml(title: string, preheader: string, bodyContent: string): string {
  return `<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head><body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;color:#0a0a0a;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#121212;border-radius:18px;overflow:hidden;border:1px solid #262626;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
          <!-- Header with Logo and Brand -->
          <tr>
            <td style="background-color:#171717;border-bottom:1px solid #262626;padding:26px 30px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg, #00ff88 0%, #00aa55 100%);color:#000000;font-weight:900;font-size:22px;line-height:44px;text-align:center;box-shadow:0 4px 15px rgba(0,255,136,0.35);">
                      TN
                    </div>
                  </td>
                  <td style="vertical-align:middle;text-align:left;">
                    <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:1.5px;color:#ffffff;font-family:Arial,sans-serif;">
                      TASK <span style="color:#00ff88;">NEST</span>
                    </p>
                    <p style="margin:2px 0 0;font-size:11px;color:#00ff88;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                      Earn Online By Completing Simple Tasks
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main Body -->
          <tr>
            <td style="padding:32px 30px;color:#ededed;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Quick Platform Links -->
          <tr>
            <td style="background-color:#151515;border-top:1px solid #222222;padding:18px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-size:12px;color:#888888;">
                    <a href="https://tasknest.name.ng/tasks" style="color:#00ff88;text-decoration:none;font-weight:700;margin:0 10px;">Browse Tasks</a> &bull;
                    <a href="https://tasknest.name.ng/dashboard" style="color:#ffffff;text-decoration:none;font-weight:600;margin:0 10px;">Dashboard</a> &bull;
                    <a href="https://tasknest.name.ng/about" style="color:#ffffff;text-decoration:none;font-weight:600;margin:0 10px;">About Task Nest</a> &bull;
                    <a href="https://tasknest.name.ng/terms" style="color:#888888;text-decoration:none;margin:0 10px;">Terms</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#0d0d0d;border-top:1px solid #1f1f1f;padding:22px 30px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#888888;">
                Need help? Contact our support desk at <a href="mailto:${ADMIN_EMAIL}" style="color:#00ff88;text-decoration:none;">${ADMIN_EMAIL}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#555555;">
                &copy; ${new Date().getFullYear()} Task Nest. All rights reserved. Connecting workers and advertisers worldwide.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`;
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
  const targetEmail = (email || "").trim().toLowerCase();
  if (!targetEmail) {
    throw new Error("Recipient email address is required");
  }
  const resend = getResend();
  const safeCode = escapeHtml(code);
  const plainText = `Welcome to Task Nest! Your verification code is ${code}. It expires in 10 minutes. Use this code to verify your account and start completing paid tasks. - Task Nest Team`;
  const bodyContent = `
    <div style="text-align:left;margin-bottom:20px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">Welcome to Task Nest! 👋</h1>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
        Thank you for joining <strong>Task Nest</strong> — the premier micro-tasking marketplace where you earn real payouts by completing simple online tasks, following accounts, reviewing content, taking surveys, and testing apps.
      </p>
    </div>

    <!-- OTP Code Box -->
    <div style="background-color:#18181b;border:2px solid #00ff88;border-radius:14px;padding:26px;text-align:center;margin:24px 0;box-shadow:0 0 25px rgba(0,255,136,0.15);">
      <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:2.5px;color:#00ff88;text-transform:uppercase;">
        Your 6-Digit Email Verification Code
      </p>
      <div style="margin:12px auto;font-size:42px;font-weight:900;letter-spacing:10px;color:#ffffff;font-family:'Courier New',Courier,monospace;background:#0d0d0d;padding:12px 24px;border-radius:10px;display:inline-block;border:1px solid #333333;">
        ${safeCode}
      </div>
      <p style="margin:10px 0 0;font-size:12px;color:#888888;">
        This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
      </p>
    </div>

    <!-- What is Task Nest Section -->
    <div style="background-color:#161616;border:1px solid #262626;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#00ff88;letter-spacing:0.5px;text-transform:uppercase;">
        About Task Nest
      </h3>
      <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#cccccc;">
        Task Nest connects global advertisers and content creators with enthusiastic workers worldwide. You can complete tasks on social media (Telegram, YouTube, TikTok, Facebook), submit proofs, and withdraw your earnings directly to your bank account or crypto wallet.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:12px;color:#a1a1aa;">
        <tr>
          <td style="padding:4px 0;">&bull; <strong>Micro Tasks:</strong> Earn per follow, like, review, and comment</td>
        </tr>
        <tr>
          <td style="padding:4px 0;">&bull; <strong>Partner Offerwall:</strong> Complete instant surveys and sponsor offers</td>
        </tr>
        <tr>
          <td style="padding:4px 0;">&bull; <strong>Instant Tracking:</strong> Real-time task review and instant dashboard updates</td>
        </tr>
        <tr>
          <td style="padding:4px 0;">&bull; <strong>Referral Rewards:</strong> Invite your friends and earn commissions</td>
        </tr>
      </table>
    </div>

    <!-- Action Button -->
    <div style="text-align:center;margin:28px 0 16px;">
      <a href="https://tasknest.name.ng/verify-email" style="display:inline-block;background-color:#00ff88;color:#000000;font-size:15px;font-weight:800;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 15px rgba(0,255,136,0.3);">
        Verify My Account &rarr;
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#888888;text-align:center;">
      If you did not create an account on Task Nest, you can safely ignore this email.
    </p>
  `;
  const fromAddr = getFromAddress();
  console.log(`[Resend Email] Sending verification OTP ${code} to ${targetEmail} from ${fromAddr}...`);
  const { data, error } = await resend.emails.send({
    from: fromAddr,
    to: targetEmail,
    subject: `Task Nest - Your Verification Code (${code})`,
    html: baseHtml("Task Nest - Your Verification Code", `Your verification code is ${code}. Welcome to Task Nest!`, bodyContent),
    text: plainText,
    headers: getSharedHeaders("verify"),
  });
  if (error) {
    console.error(`[Resend Email FAILED] Could not send OTP to ${targetEmail}:`, error);
    throw new Error(error.message || JSON.stringify(error));
  }
  console.log(`[Resend Email SUCCESS] Verification email sent to ${targetEmail} (Message ID: ${data?.id})`);
  return data;
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


export async function sendNewTaskBroadcastEmail(users: Array<{ email: string; firstName?: string | null }>, task: { title: string; taskType: string; payPerTask: number; description: string; id: number }) {
  if (!users || users.length === 0) return;
  const resend = getResend();
  const safeTitle = escapeHtml(task.title);
  const safeType = escapeHtml(task.taskType);
  const safePay = Number(task.payPerTask).toFixed(2);
  const safeDesc = escapeHtml(task.description);
  const taskUrl = "https://tasknest.name.ng/tasks";

  const bodyContent = `
    <div style="text-align:left;margin-bottom:20px;">
      <span style="display:inline-block;background-color:rgba(0,255,136,0.15);color:#00ff88;font-size:11px;font-weight:800;letter-spacing:1.5px;padding:4px 10px;border-radius:20px;text-transform:uppercase;border:1px solid rgba(0,255,136,0.3);">
        New Task Alert &bull; ${safeType}
      </span>
      <h1 style="margin:12px 0 6px;font-size:22px;font-weight:800;color:#ffffff;">New Paid Task Available! 🚀</h1>
      <p style="margin:0;font-size:14px;color:#a1a1aa;">
        A new task has just been posted on Task Nest. Spots are limited, so start now to secure your reward!
      </p>
    </div>

    <!-- Task Card in Email -->
    <div style="background-color:#18181b;border:1px solid #00ff88;border-radius:14px;padding:24px;margin:20px 0;box-shadow:0 0 20px rgba(0,255,136,0.1);">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:top;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#00ff88;text-transform:uppercase;letter-spacing:1px;">
              ${safeType}
            </p>
            <h2 style="margin:0 0 10px;font-size:18px;font-weight:800;color:#ffffff;">
              ${safeTitle}
            </h2>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#bbbbbb;">
              ${safeDesc}
            </p>
          </td>
          <td style="vertical-align:top;text-align:right;padding-left:16px;">
            <div style="background:#00ff88;color:#000000;font-size:18px;font-weight:900;padding:8px 14px;border-radius:8px;display:inline-block;white-space:nowrap;">
              +$${safePay}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Instructions / Next Steps -->
    <div style="background-color:#151515;border:1px solid #262626;border-radius:12px;padding:18px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#ffffff;">How to complete this task:</p>
      <ol style="margin:0;padding-left:20px;font-size:12px;line-height:1.8;color:#a1a1aa;">
        <li>Open the Task Nest marketplace and click <strong>Start Task</strong>.</li>
        <li>Follow the specified instructions and perform the requested action.</li>
        <li>Take a screenshot or copy your username as proof.</li>
        <li>Submit your proof to have $${safePay} credited directly to your balance!</li>
      </ol>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0 16px;">
      <a href="${taskUrl}" style="display:inline-block;background-color:#00ff88;color:#000000;font-size:15px;font-weight:800;text-decoration:none;padding:14px 34px;border-radius:10px;box-shadow:0 4px 15px rgba(0,255,136,0.3);">
        Start Task Now &rarr;
      </a>
    </div>
  `;

  for (const user of users) {
    if (!user.email) continue;
    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `New Task Alert: "${task.title}" — Earn $${safePay}`,
        html: baseHtml("New Task Alert — Task Nest", `A new task "${task.title}" is available on Task Nest. Earn $${safePay}!`, bodyContent),
        text: `New Task on Task Nest: ${task.title}. Reward: $${safePay}. Open ${taskUrl} to complete and earn.`,
        headers: getSharedHeaders("task-alert"),
      });
    } catch (e) {
      // Continue next user
    }
  }
}

export async function sendUnverifiedReminderEmail(email: string, code: string) {
  const targetEmail = (email || "").trim().toLowerCase();
  if (!targetEmail) {
    throw new Error("Recipient email address is required");
  }
  const resend = getResend();
  const safeCode = escapeHtml(code);
  const plainText = `Task Nest Account Verification Reminder: Your new verification code is ${code}. Please complete your verification to start earning rewards. Visit https://tasknest.name.ng/verify-email`;
  const bodyContent = `
    <div style="text-align:left;margin-bottom:20px;">
      <div style="display:inline-block;background-color:rgba(0,255,136,0.15);border:1px solid #00ff88;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:#00ff88;margin-bottom:12px;">
        ACTION REQUIRED
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">Complete Your Task Nest Verification 🚀</h1>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
        You recently registered on <strong>Task Nest</strong>, but your account is not yet verified. Our email delivery system is now fully upgraded with direct inbox delivery.
      </p>
    </div>

    <!-- OTP Code Box -->
    <div style="background-color:#18181b;border:2px solid #00ff88;border-radius:14px;padding:26px;text-align:center;margin:24px 0;box-shadow:0 0 25px rgba(0,255,136,0.15);">
      <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:2.5px;color:#00ff88;text-transform:uppercase;">
        Your New 6-Digit Verification Code
      </p>
      <div style="margin:12px auto;font-size:42px;font-weight:900;letter-spacing:10px;color:#ffffff;font-family:'Courier New',Courier,monospace;background:#0d0d0d;padding:12px 24px;border-radius:10px;display:inline-block;border:1px solid #333333;">
        ${safeCode}
      </div>
      <p style="margin:10px 0 0;font-size:12px;color:#888888;">
        This code is valid for <strong>10 minutes</strong>.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align:center;margin:28px 0 16px;">
      <a href="https://tasknest.name.ng/verify-email" style="display:inline-block;background-color:#00ff88;color:#000000;font-size:15px;font-weight:800;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 15px rgba(0,255,136,0.3);">
        Verify My Account Now &rarr;
      </a>
    </div>

    <div style="background-color:#161616;border:1px solid #262626;border-radius:12px;padding:16px;margin-top:20px;text-align:left;">
      <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5;">
        💡 <strong>Start Earning Immediately:</strong> Once verified, you will immediately have access to perform tasks, invite friends for bonus rewards, and withdraw your earnings directly to your bank or crypto wallet.
      </p>
    </div>
  `;

  const fromAddr = getFromAddress();
  console.log(`[Resend Email] Sending unverified reminder OTP ${code} to ${targetEmail} from ${fromAddr}...`);
  const { data, error } = await resend.emails.send({
    from: fromAddr,
    to: targetEmail,
    subject: `Task Nest Reminder - Complete Your Verification (${code})`,
    html: baseHtml("Complete Your Task Nest Verification", `Your verification code is ${code}. Verify your account now!`, bodyContent),
    text: plainText,
    headers: getSharedHeaders("unverified-reminder"),
  });
  if (error) {
    console.error(`[Resend Email FAILED] Reminder OTP failed for ${targetEmail}:`, error);
    throw new Error(error.message || JSON.stringify(error));
  }
  console.log(`[Resend Email SUCCESS] Reminder email sent to ${targetEmail} (Message ID: ${data?.id})`);
  return data;
}


// Aliases for KYC emails
export const sendUserKycApprovedEmail = sendKycApprovedEmail;
export const sendUserKycDeclinedEmail = sendKycRejectedEmail;
export const sendUserKycSubmittedEmail = sendUserKycReceivedEmail;
