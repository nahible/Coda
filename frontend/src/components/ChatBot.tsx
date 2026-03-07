import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ListTodo, HelpCircle, PlusCircle, CheckCircle } from 'lucide-react';
import type { Todo } from './TodoList';

interface Message { id: number; role: 'user' | 'bot'; text: string; }
interface ChatBotProps { todos: Todo[]; setTodos: React.Dispatch<React.SetStateAction<Todo[]>>; }

let msgId = 1;
let todoIdCounter = 100;

function botReply(text: string, todos: Todo[], setTodos: React.Dispatch<React.SetStateAction<Todo[]>>): string {
  const lower = text.toLowerCase().trim();

  if (lower.startsWith('add task ') || lower.startsWith('add todo ')) {
    const taskText = text.slice(9).trim();
    if (taskText) {
      setTodos((prev) => [...prev, { id: todoIdCounter++, text: taskText, done: false }]);
      return `✅ Added "${taskText}" to your task list!`;
    }
    return 'Please provide a task name after "add task".';
  }

  if (lower.includes('show tasks') || lower.includes('list tasks') || lower.includes('my tasks')) {
    if (todos.length === 0) return '📋 Your task list is empty.';
    const pending = todos.filter((t) => !t.done);
    const done = todos.filter((t) => t.done);
    let msg = `📋 **Your Tasks** (${pending.length} pending, ${done.length} done)\n\n`;
    pending.forEach((t) => { msg += `• ${t.text}\n`; });
    if (done.length > 0) { msg += `\n~~Completed:~~\n`; done.forEach((t) => { msg += `• ~~${t.text}~~\n`; }); }
    return msg;
  }

  if (lower.startsWith('complete ') || lower.startsWith('done ') || lower.startsWith('finish ')) {
    const keyword = lower.startsWith('complete ') ? 'complete ' : lower.startsWith('done ') ? 'done ' : 'finish ';
    const taskName = text.slice(keyword.length).trim().toLowerCase();
    let found = false;
    setTodos((prev) => prev.map((t) => { if (t.text.toLowerCase().includes(taskName) && !t.done) { found = true; return { ...t, done: true }; } return t; }));
    return found ? `✅ Marked as complete!` : `Couldn't find a pending task matching "${taskName}".`;
  }

  if (lower.startsWith('delete ') || lower.startsWith('remove ')) {
    const keyword = lower.startsWith('delete ') ? 'delete ' : 'remove ';
    const taskName = text.slice(keyword.length).trim().toLowerCase();
    let found = false;
    setTodos((prev) => prev.filter((t) => { if (t.text.toLowerCase().includes(taskName) && !found) { found = true; return false; } return true; }));
    return found ? `🗑️ Removed the task!` : `Couldn't find a task matching "${taskName}".`;
  }

  if (lower === 'help' || lower === '/help') {
    return `🤖 **Commands:**\n\n• **add task [name]** — Add a new task\n• **show tasks** — List all tasks\n• **complete [name]** — Mark complete\n• **delete [name]** — Remove a task`;
  }

  const responses = [
    "That's a great point! Let me know if you need help with your tasks. 😊",
    "Interesting! Try typing **help** to see what I can do.",
    "I'm here to help you stay productive! Need to manage tasks? Just ask.",
    "Got it! I'm your productivity buddy — ask me anything. 💪",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

const quickActions = [
  { icon: PlusCircle, label: 'Add Task', command: 'add task ' },
  { icon: ListTodo, label: 'My Tasks', command: 'show tasks' },
  { icon: CheckCircle, label: 'Complete', command: 'complete ' },
  { icon: HelpCircle, label: 'Help', command: 'help' },
];

export default function ChatBot({ todos, setTodos }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

  function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { id: msgId++, role: 'user', text: msg }]);
    if (!text) setInput('');
    setTimeout(() => {
      const reply = botReply(msg, todos, setTodos);
      setMessages((prev) => [...prev, { id: msgId++, role: 'bot', text: reply }]);
    }, 400 + Math.random() * 400);
  }

  function handleQuickAction(command: string) {
    if (command.endsWith(' ')) {
      setInput(command);
      document.getElementById('chat-input')?.focus();
    } else {
      send(command);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden h-full" id="chatbot">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-soft">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-accent-strong to-accent-muted flex items-center justify-center text-ink-on-accent shadow-[0_3px_12px_rgba(120,100,160,0.15)]">
            <Sparkles size={18} strokeWidth={1.4} />
          </div>
          <div>
            <h3 className="text-[0.92rem] font-semibold text-ink">Coda Assistant</h3>
            <div className="flex items-center gap-1.5 text-[0.68rem] text-ink-faint mt-0.5">
              <span className="w-[6px] h-[6px] bg-green-dot rounded-full" />
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <div className="w-16 h-16 rounded-[20px] bg-panel-inner flex items-center justify-center text-ink-faint">
              <Bot size={28} strokeWidth={1.2} />
            </div>
            <div>
              <p className="text-[0.88rem] font-medium text-ink-secondary">What can I help you with?</p>
              <p className="text-[0.72rem] text-ink-faint mt-1">Use the shortcuts below or type a message</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.command)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-panel-inner border border-border-soft text-[0.74rem] font-medium text-ink-secondary hover:bg-accent-muted hover:text-ink hover:border-accent transition-all duration-200 cursor-pointer"
                >
                  <action.icon size={14} strokeWidth={1.4} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 anim-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5
                ${msg.role === 'bot'
                  ? 'bg-gradient-to-br from-accent-strong to-accent-muted text-ink-on-accent'
                  : 'bg-user-bubble text-ink-on-accent'}`}>
                {msg.role === 'bot' ? <Bot size={15} strokeWidth={1.4} /> : <User size={15} strokeWidth={1.4} />}
              </div>
              <div className={`max-w-[78%] px-5 py-4 text-[0.82rem] leading-relaxed whitespace-pre-wrap break-words
                ${msg.role === 'bot'
                  ? 'bg-bot-bubble rounded-[18px] rounded-tl-[6px] text-ink border border-border-soft'
                  : 'bg-user-bubble rounded-[18px] rounded-tr-[6px] text-ink'}`}>
                {msg.text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                    : part.startsWith('~~') && part.endsWith('~~')
                      ? <del key={i}>{part.slice(2, -2)}</del>
                      : <span key={i}>{part}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input bar */}
      <div className="pt-4 border-t border-border-soft">
        <div className="flex gap-2.5">
          <input
            className="flex-1 px-5 py-3.5 rounded-[16px] bg-panel-inner border border-border-soft text-[0.82rem] text-ink placeholder:text-ink-faint focus:border-accent focus:shadow-[0_0_0_3px_rgba(170,155,200,0.12)] transition-all duration-200 outline-none"
            id="chat-input"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            className="w-11 h-11 rounded-[14px] bg-accent-strong text-ink-on-accent flex items-center justify-center shadow-[0_3px_12px_rgba(120,100,160,0.18)] shrink-0 hover:shadow-[0_5px_18px_rgba(120,100,160,0.25)] hover:scale-105 transition-all duration-200 cursor-pointer"
            onClick={() => send()} id="chat-send-btn" title="Send"
          >
            <Send size={16} strokeWidth={1.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
