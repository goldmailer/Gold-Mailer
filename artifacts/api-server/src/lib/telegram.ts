export async function checkTelegramChannelMember(channelTarget: string, userTelegramHandle: string): Promise<{
  joined: boolean;
  status: string;
  detail: string;
}> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return {
      joined: false,
      status: "unverified",
      detail: "TELEGRAM_BOT_TOKEN is not configured on server",
    };
  }

  let chatId = channelTarget.trim();
  if (chatId.includes("t.me/")) {
    const match = chatId.match(/t\.me\/([a-zA-Z0-9_+]+)/);
    if (match) chatId = "@" + match[1];
  } else if (!chatId.startsWith("@") && !chatId.startsWith("-100") && isNaN(Number(chatId))) {
    chatId = "@" + chatId;
  }

  let username = userTelegramHandle.trim();
  if (username.startsWith("@")) username = username.slice(1);

  try {
    const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${encodeURIComponent(username)}`;
    const res = await fetch(url);
    const data = (await res.json()) as any;
    if (data.ok) {
      const status = data.result?.status;
      const isMember = ["creator", "administrator", "member", "restricted"].includes(status);
      return {
        joined: isMember,
        status: isMember ? "verified" : "not_member",
        detail: `Telegram member status: ${status}`,
      };
    } else {
      return {
        joined: false,
        status: "api_error",
        detail: data.description || "Telegram API returned error",
      };
    }
  } catch (error: any) {
    return {
      joined: false,
      status: "network_error",
      detail: error.message || "Failed to reach Telegram API",
    };
  }
}
