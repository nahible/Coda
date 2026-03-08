import { useState, useEffect, useRef } from "react";
import { GridStack, type GridStackWidget } from "gridstack";
import type { AuthUser } from "../api/auth";
import {
  createTodoByUserId,
  deleteTodoByUserId,
  getTodoListByUserId,
  setTodoCompletedByUserId,
  setTodoTextByUserId,
  type Todo,
} from "../api/todos";
import Sidebar from "../components/Sidebar";
import SpotifyPlayer from "../components/SpotifyPlayer";
import PomodoroTimer from "../components/PomodoroTimer";
import TodoList from "../components/TodoList";
import ChatBot from "../components/ChatBot";

type HomePageProps = {
  onLogout: () => void | Promise<void>;
  user: AuthUser;
};

const widgetShellClassName = [
  "grid-stack-item-content",
  "flex flex-col overflow-hidden rounded-[24px] border border-border-soft bg-panel p-6",
  "shadow-panel",
  "backdrop-blur-[10px] transition-all duration-300",
  "hover:shadow-panel-hover",
].join(" ");

const DEFAULT_LAYOUT: GridStackWidget[] = [
  { id: "spotify-item", x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 5 },
  { id: "pomodoro-item", x: 0, y: 6, w: 4, h: 6, minW: 2, minH: 4 },
  { id: "todo-item", x: 4, y: 8, w: 8, h: 4, minW: 3, minH: 4 },
  { id: "chat-item", x: 4, y: 0, w: 8, h: 8, minW: 4, minH: 8 },
];

export default function HomePage({ onLogout, user }: HomePageProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isTodosLoading, setIsTodosLoading] = useState(true);
  const [isTodoMutating, setIsTodoMutating] = useState(false);
  const [todosError, setTodosError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);

  useEffect(() => {
    if (gridRef.current && !gridInstanceRef.current) {
      gridInstanceRef.current = GridStack.init(
        {
          column: 12,
          cellHeight: 70,
          margin: 12,
          float: true,
          animate: true,
          resizable: {
            handles: "e, se, s, sw, w, nw, n, ne",
          },
        },
        gridRef.current,
      );

      // We no longer rely strictly on hardcoded dimensions here,
      // GridStack will extract the minimums from our default array 
      // or the data-gs-* attributes, but ensure constraints are applied:
      const spotifyEl = document.getElementById("spotify-item");
      if (spotifyEl && gridInstanceRef.current) {
        gridInstanceRef.current.update(spotifyEl, { minW: 3, minH: 4 });
      }

      const pomodoroEl = document.getElementById("pomodoro-item");
      if (pomodoroEl && gridInstanceRef.current) {
        gridInstanceRef.current.update(pomodoroEl, { minW: 2, minH: 4 });
      }
    }

    return () => {
      if (gridInstanceRef.current) {
        gridInstanceRef.current.destroy(false);
        gridInstanceRef.current = null;
      }
    };
  }, []);

  const handleResetLayout = () => {
    if (gridInstanceRef.current) {
      // GridStack automatically finds the elements by ID and re-places them
      gridInstanceRef.current.load(DEFAULT_LAYOUT);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadTodos = async () => {
      setIsTodosLoading(true);
      setTodosError(null);

      try {
        const nextTodos = await getTodoListByUserId();

        if (!isActive) {
          return;
        }

        setTodos(nextTodos);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error(error);
        setTodosError(
          error instanceof Error
            ? error.message
            : "Unable to load your tasks right now.",
        );
      } finally {
        if (isActive) {
          setIsTodosLoading(false);
        }
      }
    };

    void loadTodos();

    return () => {
      isActive = false;
    };
  }, [user.id]);

  const handleCreateTodo = async (text: string) => {
    setIsTodoMutating(true);
    setTodosError(null);

    try {
      const nextTodo = await createTodoByUserId(text);
      setTodos((prev) => [...prev, nextTodo]);
      return true;
    } catch (error) {
      console.error(error);
      setTodosError(
        error instanceof Error
          ? error.message
          : "Unable to create your task right now.",
      );
      return false;
    } finally {
      setIsTodoMutating(false);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    setIsTodoMutating(true);
    setTodosError(null);

    try {
      const updatedTodo = await setTodoCompletedByUserId(
        todo.id,
        !todo.completed,
      );
      setTodos((prev) =>
        prev.map((currentTodo) =>
          currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
        ),
      );
    } catch (error) {
      console.error(error);
      setTodosError(
        error instanceof Error
          ? error.message
          : "Unable to update your task right now.",
      );
    } finally {
      setIsTodoMutating(false);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    setIsTodoMutating(true);
    setTodosError(null);

    try {
      await deleteTodoByUserId(todoId);
      setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
    } catch (error) {
      console.error(error);
      setTodosError(
        error instanceof Error
          ? error.message
          : "Unable to delete your task right now.",
      );
    } finally {
      setIsTodoMutating(false);
    }
  };

  const handleUpdateTodoText = async (todoId: number, text: string) => {
    setIsTodoMutating(true);
    setTodosError(null);

    try {
      const updatedTodo = await setTodoTextByUserId(todoId, text);
      setTodos((prev) =>
        prev.map((currentTodo) =>
          currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
        ),
      );
      return true;
    } catch (error) {
      console.error(error);
      setTodosError(
        error instanceof Error
          ? error.message
          : "Unable to rename your task right now.",
      );
      return false;
    } finally {
      setIsTodoMutating(false);
    }
  };

  return (
    <div className="flex h-screen p-6 gap-6" id="app-shell">
      {/* Sidebar — outside the grid */}
      <Sidebar onLogout={onLogout} onResetLayout={handleResetLayout} user={user} />

      {/* Gridstack Bento Grid */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid-stack min-h-full" ref={gridRef}>
          {/* Spotify Player */}
          <div
            className="grid-stack-item"
            id="spotify-item"
            gs-id="spotify-item"
            gs-x="0"
            gs-y="0"
            gs-w="4"
            gs-h="6"
            gs-min-w="3"
            gs-min-h="5"
          >
            <div className={widgetShellClassName}>
              <SpotifyPlayer />
            </div>
          </div>

          {/* Pomodoro Timer */}
          <div
            className="grid-stack-item"
            id="pomodoro-item"
            gs-id="pomodoro-item"
            gs-x="0"
            gs-y="6"
            gs-w="4"
            gs-h="6"
            gs-min-w="2"
            gs-min-h="4"
          >
            <div className={widgetShellClassName}>
              <PomodoroTimer />
            </div>
          </div>

          {/* Todo List */}
          <div
            className="grid-stack-item"
            id="todo-item"
            gs-id="todo-item"
            gs-x="4"
            gs-y="8"
            gs-w="8"
            gs-h="4"
            gs-min-w="3"
            gs-min-h="4"
          >
            <div className={widgetShellClassName}>
              <TodoList
                todos={todos}
                isLoading={isTodosLoading}
                isMutating={isTodoMutating}
                errorMessage={todosError}
                onCreate={handleCreateTodo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onUpdateText={handleUpdateTodoText}
              />
            </div>
          </div>

          {/* ChatBot */}
          <div
            className="grid-stack-item"
            id="chat-item"
            gs-id="chat-item"
            gs-x="4"
            gs-y="0"
            gs-w="8"
            gs-h="8"
            gs-min-w="4"
            gs-min-h="8"
          >
            <div className={widgetShellClassName}>
              <ChatBot />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
