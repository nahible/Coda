export type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type GeminiResponsePayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const SYSTEM_INSTRUCTION = [
  "You are Coda Assistant inside a student productivity dashboard.",
  "Chat naturally and helpfully.",
  "Do not claim you can modify tasks, control Spotify, or operate the Pomodoro timer.",
  "If asked to interact with the app, say that app actions are not connected yet and continue the conversation normally.",
].join(" ");

export const MAX_CHAT_TURNS = 20;

export const normalizeChatMessages = (value: unknown): ChatMessage[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const role = (item as { role?: unknown }).role;
    const text = (item as { text?: unknown }).text;

    if (
      (role !== "user" && role !== "assistant") ||
      typeof text !== "string" ||
      text.trim().length === 0
    ) {
      return [];
    }

    return [
      {
        role,
        text: text.trim().slice(0, 4000),
      },
    ];
  });
};

export const generateChatReply = async (
  messages: ChatMessage[],
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const geminiResponse = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.text }],
        })),
      }),
    },
  );

  const payload = (await geminiResponse.json().catch(() => null)) as
    | GeminiResponsePayload
    | null;

  if (!geminiResponse.ok) {
    console.error("Gemini chat request failed:", payload);
    throw new Error(
      payload?.error?.message ||
        "Gemini request failed. Check the backend logs.",
    );
  }

  const reply = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();

  if (!reply) {
    console.error("Gemini chat response was empty:", payload);
    throw new Error("Gemini returned an empty response");
  }

  return reply;
};
