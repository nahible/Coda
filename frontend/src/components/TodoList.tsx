import { useState } from "react";
import { Plus, Check, ClipboardList, Trash2 } from "lucide-react";
import type { Todo } from "../api/todos";

interface TodoListProps {
  errorMessage: string | null;
  isLoading: boolean;
  isMutating: boolean;
  onCreate: (text: string) => Promise<boolean>;
  onDelete: (todoId: number) => Promise<void>;
  onToggle: (todo: Todo) => Promise<void>;
  onUpdateText: (todoId: number, text: string) => Promise<boolean>;
  todos: Todo[];
}

export default function TodoList({
  todos,
  isLoading,
  isMutating,
  errorMessage,
  onCreate,
  onToggle,
  onDelete,
  onUpdateText,
}: TodoListProps) {
  const [input, setInput] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  async function addTodo() {
    const text = input.trim();
    if (!text || isMutating) return;

    const wasCreated = await onCreate(text);

    if (wasCreated) {
      setInput("");
    }
  }

  function startEditing(todo: Todo) {
    if (isMutating) {
      return;
    }

    setEditingTodoId(todo.id);
    setEditingText(todo.text);
  }

  function cancelEditing() {
    setEditingTodoId(null);
    setEditingText("");
  }

  function autoResizeTextarea(element: HTMLTextAreaElement) {
    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }

  async function saveEditedTodo(todo: Todo) {
    const text = editingText.trim();

    if (editingTodoId !== todo.id) {
      return;
    }

    if (!text || text === todo.text) {
      cancelEditing();
      return;
    }

    const wasUpdated = await onUpdateText(todo.id, text);

    if (wasUpdated) {
      cancelEditing();
    }
  }

  const pending = todos.filter((t) => !t.completed).length;

  const getTodoBadge = (todo: Todo) =>
    todo.completed
      ? {
          label: "Done",
          className: "bg-[#dcefdc] text-[#2e6a3f]",
        }
      : {
          label: "Task",
          className: "bg-[#d8defc] text-[#243b8f]",
        };

  return (
    <div className="flex flex-col overflow-hidden h-full" id="todo-list">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[0.85rem] font-semibold text-ink-muted uppercase tracking-widest">
          Tasks
        </h3>
        <span className="text-[0.72rem] font-semibold bg-tag-bg text-ink-secondary px-3 py-1 rounded-full">
          {pending} remaining
        </span>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-[rgba(217,99,110,0.24)] bg-[rgba(217,99,110,0.08)] px-4 py-3 text-[0.78rem] text-danger">
          {errorMessage}
        </div>
      ) : null}

      {/* Input */}
      <div className="flex items-center gap-4 bg-[rgba(255,255,255,0.42)] px-5 py-4">
        <input
          className="w-full min-w-0 flex-1 appearance-none rounded-xl border border-[rgba(170,155,200,0.2)] bg-[rgba(241,237,247,0.72)] pl-4 pr-4 py-2   text-left text-[0.95rem] leading-relaxed text-ink placeholder:text-ink-faint outline-none transition-all duration-200 focus:border-accent focus:bg-white/75 focus:shadow-[0_0_0_3px_rgba(170,155,200,0.12)]"
          id="todo-input"
          placeholder="Add a new task…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          disabled={isLoading || isMutating}
        />
        <button
          className="h-14 w-14 rounded-full bg-accent-strong text-ink-on-accent flex items-center justify-center shadow-[0_6px_18px_rgba(120,100,160,0.16)] shrink-0 transition-all duration-200 cursor-pointer hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(120,100,160,0.22)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          onClick={addTodo}
          id="todo-add-btn"
          title="Add task"
          disabled={isLoading || isMutating || input.trim().length === 0}
        >
          <Plus size={19} strokeWidth={1.6} />
        </button>
      </div>

      {/* List */}
      <ul
        className="flex-1 overflow-y-auto flex flex-col gap-4 px-1"
        id="todo-items"
      >
        {isLoading ? (
          <li className="text-center text-ink-faint text-[0.85rem]">
            Loading your tasks...
          </li>
        ) : todos.length === 0 ? (
          <li className="text-center text-ink-faint text-sm">
            <div className="text-accent-muted mb-3 mt-10">
              <ClipboardList size={32} strokeWidth={1.4} />
            </div>
            No tasks yet — add one above!
          </li>
        ) : (
          todos.map((todo) => (
            <li
              key={todo.id}
              className={`group grid grid-cols-[32px_minmax(0,1fr)_auto_32px] items-center gap-2 rounded-xl bg-[rgba(255,255,255,0.42)] px-4 py-2 transition-all duration-200 animate-[fadeInUp_0.5s_ease_forwards] ${
                editingTodoId === todo.id
                  ? "border border-accent shadow-[0_10px_30px_rgba(170,155,200,0.14)]"
                  : "border border-transparent hover:border-border-soft hover:bg-white/50"
              }`}
            >
              <button
                type="button"
                className={`h-7 w-7 rounded-[9px] border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200 ${
                  todo.completed
                    ? "bg-check-bg border-check-bg text-ink-on-accent"
                    : "border-[rgba(120,120,132,0.35)] text-transparent hover:border-accent"
                }`}
                onClick={() => void onToggle(todo)}
                role="checkbox"
                aria-checked={todo.completed}
                disabled={isMutating}
              >
                {todo.completed && <Check size={15} strokeWidth={2.5} />}
              </button>
              {editingTodoId === todo.id ? (
                <textarea
                  className="col-start-2 min-h-[52px] w-full min-w-0 overflow-hidden resize-none rounded-[16px] border border-accent bg-panel-alt px-4 py-3 text-left text-[1rem] leading-relaxed text-ink outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(170,155,200,0.12)]"
                  value={editingText}
                  onChange={(event) => {
                    setEditingText(event.target.value);
                    autoResizeTextarea(event.currentTarget);
                  }}
                  onBlur={() => void saveEditedTodo(todo)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void saveEditedTodo(todo);
                    }

                    if (event.key === "Escape") {
                      event.preventDefault();
                      cancelEditing();
                    }
                  }}
                  ref={(element) => {
                    if (element) {
                      autoResizeTextarea(element);
                    }
                  }}
                  autoFocus
                  disabled={isMutating}
                />
              ) : (
                <button
                  type="button"
                  className={`col-start-2 min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-left text-[0.98rem] font-medium leading-relaxed transition-all duration-200 ${
                    todo.completed ? "line-through text-ink-faint" : "text-ink"
                  }`}
                  onClick={() => startEditing(todo)}
                  disabled={isMutating}
                  title="Click to edit"
                >
                  {todo.text}
                </button>
              )}

              {editingTodoId === todo.id ? null : (
                <span
                  className={`shrink-0 rounded-full px-4 py-2 text-[0.86rem] font-semibold ${getTodoBadge(todo).className}`}
                >
                  {getTodoBadge(todo).label}
                </span>
              )}

              <button
                className="h-8 w-8 rounded-full flex items-center justify-center text-[rgba(120,120,132,0.72)] transition-all duration-200 cursor-pointer hover:bg-[rgba(217,99,110,0.08)] hover:text-danger disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[rgba(120,120,132,0.72)]"
                onClick={() => {
                  if (editingTodoId === todo.id) {
                    cancelEditing();
                  }

                  void onDelete(todo.id);
                }}
                title="Delete"
                disabled={isMutating}
              >
                <Trash2 size={16} strokeWidth={1.7} />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
