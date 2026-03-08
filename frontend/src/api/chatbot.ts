const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001";

const CHAT_API_BASE = `${API_BASE_URL}/chatbot`;

export type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type ChatResponse = {
  message?: string;
  error?: string;
};

export async function sendChatMessage(
  messages: ChatMessage[],
): Promise<string> {
  const response = await fetch(CHAT_API_BASE, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ChatResponse | null;

  if (!response.ok || !payload?.message) {
    throw new Error(payload?.error || "Failed to reach the assistant.");
  }

  return payload.message;
}
