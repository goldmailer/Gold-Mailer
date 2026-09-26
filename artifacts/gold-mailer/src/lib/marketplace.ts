export const taskTypes = [
  // ── Social Tasks ──
  "Follow on Instagram",
  "Like Instagram Post",
  "Comment on Instagram Post",
  "Follow on Facebook Page",
  "Like Facebook Post",
  "Share Facebook Post",
  "Follow on Twitter / X",
  "Like Tweet on X",
  "Retweet on X",
  "Follow on TikTok",
  "Like TikTok Video",
  "Follow on YouTube Channel",
  "Like YouTube Video",
  "Watch YouTube Video 60s",
  "Join Telegram Channel",
  "Join Telegram Group",
  "Follow on Threads",
  "Connect on LinkedIn",
  "Follow on Snapchat",

  // ── Comments Tasks ──
  // TikTok Comments
  "TikTok Custom Comments",
  "TikTok Random Comments",
  "TikTok Emoji Comments",
  "TikTok Positive Comments",
  // Facebook Comments
  "Facebook Custom Comments",
  "Facebook Random Comments",
  "Facebook Sticker Comments",
  "Facebook Tag Friends Comments",
  // Instagram Comments
  "Instagram Custom Comments",
  "Instagram Random Comments",
  "Instagram Emoji Comments",
  // YouTube Comments
  "YouTube Custom Comments",
  "YouTube Random Comments",
  // Other Comments
  "X / Twitter Comments / Replies",
  "LinkedIn Post Comments",
  "Reddit Comments",
  "Telegram Post Comments",
  "Threads Comments",
  "Google Maps Custom Comments / Reviews",
  "Play Store App Reviews / Comments",
  "Website Blog Comments",
  "Quora Answer Upvotes + Comments",
  "Discord Comments / Chat",
  "Snapchat Story Replies",

  // ── App & Website Tasks ──
  "Download App from Play Store",
  "Install App and Register",
  "Rate 5 Stars on Play Store",
  "Visit Website 1 Minute",
  "Sign Up on Website",
  "Watch Video Ad 30s",

  // ── Engagement Tasks ──
  "Join WhatsApp Channel",
  "Join Discord Server",
  "Upvote on Reddit",
  "Review on Google",
  "Refer a Friend",

  // ── Additional & Custom ──
  "YouTube Watch & Subscribe",
  "Survey/Questionnaire",
  "Review on Google/Trustpilot",
  "Other (Custom)",
] as const;

export type TaskType = typeof taskTypes[number];

export type MarketplaceTask = {
  id: number;
  title: string;
  taskType: string;
  description: string;
  proofType: "screenshot" | "link" | "text";
  taskUrl?: string;
  url?: string;
  workersNeeded: number;
  workersCompleted: number;
  payPerTask: number;
  totalCost: number;
  status: string;
  createdAt: string;
  creatorName: string;
};

export type Wallets = {
  earningWallet: number;
  advertisingWallet: number;
  adminWallet?: number | null;
  payoutAddress: string | null;
};

export const categories = [
  { label: "Comments & Replies", icon: "💬", type: "Instagram Custom Comments" },
  { label: "Instagram & TikTok", icon: "◉", type: "Follow on Instagram" },
  { label: "YouTube & Video", icon: "▶", type: "Watch YouTube Video 60s" },
  { label: "Facebook & X", icon: "◈", type: "Follow on Twitter / X" },
  { label: "App & Web tasks", icon: "⌁", type: "Download App from Play Store" },
  { label: "Communities", icon: "◎", type: "Join Telegram Channel" },
  { label: "Reviews & Ratings", icon: "★", type: "Google Maps Custom Comments / Reviews" },
] as const;

export const TASK_PRICING_OPTIONS = [
  "0.01",
  "0.02",
  "0.03",
  "0.04",
  "0.05",
  "0.06",
  "0.07",
  "0.08",
  "0.09",
  "0.10",
  "0.20",
  "0.25",
  "0.30",
  "0.40",
  "0.50",
  "0.51",
  "0.60",
  "0.70",
  "0.80",
  "0.90",
  "1.00",
  "1.50",
  "2.00",
  "5.00",
  "10.00",
] as const;
