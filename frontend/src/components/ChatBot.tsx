import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Sparkles, HelpCircle } from "lucide-react";
import {
  sendChatMessage,
  type ChatMessage as ApiChatMessage,
} from "../api/chatbot";

interface Message extends ApiChatMessage {
  id: number;
}

let msgId = 1;

const quickActions = [
  {
    icon: HelpCircle,
    label: "Help",
    command: "Give me a quick introduction to what you can help with here.",
  },
];

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  async function send(text?: string) {
    const msg = (text || input).trim();

    if (!msg || isSending) {
      return;
    }

    const userMessage: Message = { id: msgId++, role: "user", text: msg };
    const nextMessages = [...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);

    if (!text) {
      setInput("");
    }

    setIsSending(true);

    try {
      const reply = await sendChatMessage(
        nextMessages.map(({ role, text: messageText }) => ({
          role,
          text: messageText,
        })),
      );

      setMessages((prev) => [
        ...prev,
        { id: msgId++, role: "assistant", text: reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: msgId++,
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "I could not reach Gemini right now.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleQuickAction(command: string) {
    if (command.endsWith(" ")) {
      setInput(command);
      document.getElementById("chat-input")?.focus();
      return;
    }

    void send(command);
  }

  const hasMessages = messages.length > 0 || isSending;

  return (
    <div className="flex h-full flex-col overflow-hidden" id="chatbot">
      <div className="flex items-center justify-between border-b border-border-soft pb-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-accent-strong to-accent-muted text-ink-on-accent shadow-[0_3px_12px_rgba(120,100,160,0.15)]">
            <Sparkles size={18} strokeWidth={1.4} />
          </div>
          <div>
            <h3 className="text-[0.92rem] font-semibold text-ink">
              Coda Assistant
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5 text-[0.68rem] text-ink-faint">
              <span className="h-[6px] w-[6px] rounded-full bg-green-dot" />
              Online
            </div>
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-6 overflow-y-auto py-6"
      >
        {!hasMessages ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-panel-inner text-ink-faint">
              <Bot size={28} strokeWidth={1.2} />
            </div>
            <div>
              <p className="text-[0.88rem] font-medium text-ink-secondary">
                What can I help you with?
              </p>
              <p className="mt-1 text-[0.72rem] text-ink-faint">
                Use the shortcut below or type a message
              </p>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.command)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border-soft bg-panel-inner px-3.5 py-2 text-[0.74rem] font-medium text-ink-secondary transition-all duration-200 hover:border-accent hover:bg-accent-muted hover:text-ink"
                >
                  <action.icon size={14} strokeWidth={1.4} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-[fadeInUp_0.5s_ease_forwards] ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
                    message.role === "assistant"
                      ? "bg-gradient-to-br from-accent-strong to-accent-muted text-ink-on-accent"
                      : "bg-user-bubble text-ink-on-accent"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Bot size={15} strokeWidth={1.4} />
                  ) : (
                    <User size={15} strokeWidth={1.4} />
                  )}
                </div>
                <div
                  className={`max-w-[78%] break-words whitespace-pre-wrap px-5 py-4 text-[0.82rem] leading-relaxed ${
                    message.role === "assistant"
                      ? "rounded-[18px] rounded-tl-[6px] border border-border-soft bg-bot-bubble text-ink"
                      : "rounded-[18px] rounded-tr-[6px] bg-user-bubble text-ink"
                  }`}
                >
                  {message.text.split(/(\*\*.*?\*\*)/g).map((part, index) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={index} className="font-semibold">
                        {part.slice(2, -2)}
                      </strong>
                    ) : part.startsWith("~~") && part.endsWith("~~") ? (
                      <del key={index}>{part.slice(2, -2)}</del>
                    ) : (
                      <span key={index}>{part}</span>
                    ),
                  )}
                </div>
              </div>
            ))}

            {isSending ? (
              <div className="flex gap-3 animate-[fadeInUp_0.5s_ease_forwards]">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent-strong to-accent-muted text-ink-on-accent">
                  <Bot size={15} strokeWidth={1.4} />
                </div>
                <div className="rounded-[18px] rounded-tl-[6px] border border-border-soft bg-bot-bubble px-5 py-4 text-[0.82rem] leading-relaxed text-ink-faint">
                  Thinking...
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="border-t border-border-soft pt-4">
        <div className="flex gap-2.5">
          <input
            className="flex-1 rounded-[16px] border border-border-soft bg-panel-inner px-5 py-3.5 text-[0.82rem] text-ink outline-none transition-all duration-200 placeholder:text-ink-faint focus:border-accent focus:shadow-[0_0_0_3px_rgba(170,155,200,0.12)]"
            id="chat-input"
            placeholder="Type a message…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void send();
              }
            }}
            disabled={isSending}
          />
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-accent-strong text-ink-on-accent shadow-[0_3px_12px_rgba(120,100,160,0.18)] transition-all duration-200 hover:scale-105 hover:shadow-[0_5px_18px_rgba(120,100,160,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void send()}
            id="chat-send-btn"
            title="Send"
            disabled={isSending || input.trim().length === 0}
          >
            <Send size={16} strokeWidth={1.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
