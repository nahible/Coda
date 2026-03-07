import { useState } from 'react';
import { Plus, Check, Trash2, ClipboardList } from 'lucide-react';

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface TodoListProps {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
}

let nextId = 4;

export default function TodoList({ todos, setTodos }: TodoListProps) {
  const [input, setInput] = useState('');

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [...prev, { id: nextId++, text, done: false }]);
    setInput('');
  }

  function toggle(id: number) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const pending = todos.filter((t) => !t.done).length;

  return (
    <div className="flex flex-col overflow-hidden h-full" id="todo-list">
      {/* Header */}
      <div className="flex items-center justify-between mb-[18px]">
        <h3 className="text-[0.85rem] font-semibold text-ink-muted uppercase tracking-widest">Tasks</h3>
        <span className="text-[0.72rem] font-semibold bg-tag-bg text-ink-secondary px-3 py-1 rounded-full">{pending} remaining</span>
      </div>

      {/* Input */}
      <div className="flex gap-3 mb-[18px]">
        <input
          className="flex-1 px-6 py-4 rounded-full bg-panel-inner border border-border-soft text-[0.88rem] text-ink placeholder:text-ink-faint focus:border-accent focus:shadow-[0_0_0_3px_rgba(170,155,200,0.12)] transition-all duration-200 outline-none"
          id="todo-input"
          placeholder="Add a new task…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button
          className="w-12 h-12 rounded-full bg-accent-strong text-ink-on-accent flex items-center justify-center shadow-[0_3px_12px_rgba(120,100,160,0.18)] shrink-0 hover:shadow-[0_5px_18px_rgba(120,100,160,0.25)] hover:scale-105 transition-all duration-200 cursor-pointer"
          onClick={addTodo} id="todo-add-btn" title="Add task"
        >
          <Plus size={19} strokeWidth={1.6} />
        </button>
      </div>

      {/* List */}
      <ul className="flex-1 overflow-y-auto flex flex-col pr-0.5" id="todo-items">
        {todos.length === 0 ? (
          <li className="text-center py-10 text-ink-faint text-[0.85rem]">
            <div className="text-accent-muted mb-3"><ClipboardList size={32} strokeWidth={1.4} /></div>
            No tasks yet — add one above!
          </li>
        ) : (
          todos.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center gap-4 px-5 py-5 mb-3 rounded-[18px] bg-panel-inner border border-transparent hover:border-border-soft hover:bg-panel-alt transition-all duration-200 anim-in"
            >
              <div
                className={`w-[26px] h-[26px] rounded-[8px] border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200
                  ${todo.done ? 'bg-check-bg border-check-bg text-ink-on-accent' : 'border-border-med text-transparent hover:border-accent'}`}
                onClick={() => toggle(todo.id)} role="checkbox" aria-checked={todo.done}
              >
                {todo.done && <Check size={15} strokeWidth={2.5} />}
              </div>
              <span className={`flex-1 text-[0.88rem] transition-all duration-200 ${todo.done ? 'line-through text-ink-faint' : 'text-ink'}`}>
                {todo.text}
              </span>
              <button
                className="w-9 h-9 rounded-[10px] flex items-center justify-center text-ink-faint opacity-0 group-hover:opacity-100 hover:bg-[rgba(217,99,110,0.1)] hover:text-danger transition-all duration-200 cursor-pointer"
                onClick={() => remove(todo.id)} title="Delete"
              >
                <Trash2 size={16} strokeWidth={1.4} />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
