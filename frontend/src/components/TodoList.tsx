import { useState } from 'react';
import { Plus, Check, ClipboardList, Trash2 } from 'lucide-react';
import type { Todo } from '../api/todos';

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

const TODO_BADGE = {
  completed: {
    label: 'Done',
    className: 'bg-emerald-100 text-emerald-700',
  },
  pending: {
    label: 'Task',
    className: 'bg-indigo-100 text-indigo-700',
  },
} as const;

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
  const [input, setInput] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  async function addTodo() {
    const text = input.trim();
    if (!text || isMutating) return;

    const wasCreated = await onCreate(text);

    if (wasCreated) {
      setInput('');
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
    setEditingText('');
  }

  function autoResizeTextarea(element: HTMLTextAreaElement) {
    element.style.height = '0px';
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

  const pending = todos.filter((todo) => !todo.completed).length;

  const getTodoBadge = (todo: Todo) =>
    todo.completed ? TODO_BADGE.completed : TODO_BADGE.pending;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink-muted">
          Tasks
        </h3>
        <span className="rounded-full bg-tag-bg px-3 py-1 text-xs font-semibold text-ink-secondary">
          {pending} remaining
        </span>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs text-danger">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex items-center gap-4 bg-white/40 px-5 py-4">
        <input
          className="min-w-0 flex-1 appearance-none rounded-xl border border-border-med bg-panel-alt px-4 py-2 text-sm leading-relaxed text-ink outline-none transition focus:border-accent focus:bg-white/75 focus:ring-4 focus:ring-accent/10 placeholder:text-ink-faint"
          placeholder="Add a new task…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && addTodo()}
          disabled={isLoading || isMutating}
        />
        <button
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-strong text-ink-on-accent shadow-lg transition hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          onClick={addTodo}
          title="Add task"
          disabled={isLoading || isMutating || input.trim().length === 0}
        >
          <Plus size={19} strokeWidth={1.6} />
        </button>
      </div>

      <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-1">
        {isLoading ? (
          <li className="py-10 text-center text-sm text-ink-faint">
            Loading your tasks...
          </li>
        ) : todos.length === 0 ? (
          <li className="py-10 text-center text-sm text-ink-faint">
            <div className="mb-3 text-accent-muted">
              <ClipboardList size={32} strokeWidth={1.4} />
            </div>
            No tasks yet — add one above!
          </li>
        ) : (
          todos.map((todo) => {
            const badge = getTodoBadge(todo);

            return (
              <li
                key={todo.id}
                className={`group flex items-center gap-3 rounded-xl bg-white/55 px-4 py-2 transition ${
                  editingTodoId === todo.id
                    ? 'border border-accent shadow-lg'
                    : 'border border-transparent hover:border-border-soft hover:bg-white/65'
                }`}
              >
                <button
                  type="button"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                    todo.completed
                      ? 'border-check-bg bg-check-bg text-ink-on-accent'
                      : 'border-ink-faint/40 hover:border-accent'
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
                    className="min-h-12 min-w-0 flex-1 resize-none overflow-hidden rounded-2xl border border-accent bg-panel-alt px-4 py-3 text-base leading-relaxed text-ink outline-none transition focus:ring-4 focus:ring-accent/10"
                    value={editingText}
                    onChange={(event) => {
                      setEditingText(event.target.value);
                      autoResizeTextarea(event.currentTarget);
                    }}
                    onBlur={() => void saveEditedTodo(todo)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void saveEditedTodo(todo);
                      }

                      if (event.key === 'Escape') {
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
                    className={`min-w-0 flex-1 wrap-anywhere whitespace-pre-wrap text-left text-base font-medium leading-relaxed transition ${
                      todo.completed ? 'text-ink-faint line-through' : 'text-ink'
                    }`}
                    onClick={() => startEditing(todo)}
                    disabled={isMutating}
                    title="Click to edit"
                  >
                    {todo.text}
                  </button>
                )}

                {editingTodoId === todo.id ? null : (
                  <span className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                )}

                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
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
            );
          })
        )}
      </ul>
    </div>
  );
}
