export const taskTypes = [
  "YouTube Watch & Subscribe",
  "Facebook Follow/Like/Share",
  "Instagram Follow/Like/Comment",
  "TikTok Follow/Like/View",
  "Twitter/X Follow/Like/Retweet",
  "Telegram Channel Join",
  "Discord Server Join",
  "Website Visit & Click",
  "Google Search & Click",
  "App Install & Review",
  "Sign Up on Website",
  "Comment on Blog/Post",
  "Like/Dislike Post",
  "Watch Ad Video",
  "Referral/Invite Friends",
  "Survey/Questionnaire",
  "Review on Google/Trustpilot",
  "Reddit Upvote/Join",
  "LinkedIn Follow/Connect",
  "WhatsApp Group Join",
  "Test Website/App",
  "Other (Custom)",
] as const;

export type TaskType = typeof taskTypes[number];

export type MarketplaceTask = {
  id: number;
  title: string;
  taskType: string;
  description: string;
  proofType: "screenshot" | "link" | "text";
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
  payoutAddress: string | null;
};

export const categories = [
  { label: "Social media", icon: "◉", type: "Instagram Follow/Like/Comment" },
  { label: "Video & content", icon: "▶", type: "YouTube Watch & Subscribe" },
  { label: "Web & apps", icon: "⌁", type: "Website Visit & Click" },
  { label: "Communities", icon: "◎", type: "Telegram Channel Join" },
  { label: "Reviews", icon: "★", type: "Review on Google/Trustpilot" },
  { label: "Surveys", icon: "▤", type: "Survey/Questionnaire" },
] as const;