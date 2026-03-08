import { Router } from "express";
import {
  generateChatReply,
  MAX_CHAT_TURNS,
  normalizeChatMessages,
} from "../lib/chatbot.js";
import { getSessionUserId } from "../lib/session.js";

const router = Router();

router.post("/", async (req, res) => {
  const userId = getSessionUserId(req);
  const messages = normalizeChatMessages(req.body.messages).slice(-MAX_CHAT_TURNS);

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (messages.length === 0) {
    res.status(400).json({ error: "At least one chat message is required" });
    return;
  }

  try {
    const reply = await generateChatReply(messages);

    res.json({ message: reply });
  } catch (error) {
    console.error("Gemini chat error:", error);
    res.status(
      error instanceof Error && error.message === "GEMINI_API_KEY is not configured"
        ? 500
        : 502,
    ).json({
      error:
        error instanceof Error ? error.message : "Failed to reach Gemini",
    });
  }
});

export default router;
