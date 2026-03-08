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
import Settings from "../components/Settings";
import CanvasCalendar from "../components/CanvasCalendar";
import CanvasWidget from "../components/CanvasWidget";

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
  { id: "spotify-item", x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
  { id: "pomodoro-item", x: 0, y: 5, w: 4, h: 5, minW: 2, minH: 3 },
  { id: "todo-item", x: 4, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
  { id: "canvas-item", x: 4, y: 5, w: 4, h: 5, minW: 4, minH: 3 },
  { id: "chat-item", x: 8, y: 0, w: 4, h: 10, minW: 4, minH: 4 },
];

export default function HomePage({ onLogout, user }: HomePageProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
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
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        onResetLayout={handleResetLayout}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {/* Full-Screen Views */}
        {activeTab !== "dashboard" && (
          <div className="w-full h-full animate-[fadeInUp_0.5s_ease_forwards]">
            {activeTab === "music" && (
              <div className="w-full h-full flex items-center justify-center p-8 bg-panel rounded-[24px] border border-border-soft shadow-panel backdrop-blur-[10px]">
                <div className="w-full max-w-2xl aspect-square md:aspect-video">
                  <SpotifyPlayer />
                </div>
              </div>
            )}
            {activeTab === "timer" && (
              <div className="w-full h-full flex items-center justify-center p-8 bg-panel rounded-[24px] border border-border-soft shadow-panel backdrop-blur-[10px]">
                <div className="w-full max-w-2xl aspect-square md:aspect-video">
                  <PomodoroTimer />
                </div>
              </div>
            )}
            {activeTab === "tasks" && (
              <div className="w-full h-full p-8 bg-panel rounded-[24px] border border-border-soft shadow-panel backdrop-blur-[10px]">
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
            )}
            {activeTab === "canvas" && (
              <div className="w-full min-h-full p-6 bg-panel rounded-[24px] border border-border-soft shadow-panel backdrop-blur-[10px] flex flex-col">
                <CanvasCalendar />
              </div>
            )}
            {activeTab === "chat" && (
               <div className="w-full h-full p-8 bg-panel rounded-[24px] border border-border-soft shadow-panel backdrop-blur-[10px] overflow-hidden flex flex-col">
                <ChatBot />
              </div>
            )}
            {activeTab === "settings" && (
               <div className="w-full h-full bg-panel rounded-[24px] border border-border-soft shadow-panel backdrop-blur-[10px] overflow-hidden flex flex-col p-8">
                <Settings onClose={() => setActiveTab("dashboard")} />
              </div>
            )}
          </div>
        )}

        {/* Gridstack Bento Grid */}
        <div
          ref={gridRef}
          className={`grid-stack min-h-full transition-opacity duration-300 ${
            activeTab === "dashboard" ? "opacity-100 visible" : "opacity-0 invisible hidden"
          }`}
          id="dashboard-grid"
        >
          {/* Spotify Player */}
          <div
            className="grid-stack-item"
            id="spotify-item"
            gs-id="spotify-item"
            gs-x="0"
            gs-y="0"
            gs-w="4"
            gs-h="5"
            gs-min-w="3"
            gs-min-h="3"
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
            gs-y="5"
            gs-w="4"
            gs-h="5"
            gs-min-w="2"
            gs-min-h="3"
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
            gs-y="0"
            gs-w="4"
            gs-h="5"
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
            id="canvas-item"
            gs-id="canvas-item"
            gs-x="4"
            gs-y="5"
            gs-w="4"
            gs-h="5"
            gs-min-w="4"
            gs-min-h="3"
          >
            <div className={widgetShellClassName}>
              <CanvasWidget onOpenCanvas={() => setActiveTab("canvas")} />
            </div>
          </div>

          {/* ChatBot */}
          <div
            className="grid-stack-item"
            id="chat-item"
            gs-id="chat-item"
            gs-x="8"
            gs-y="0"
            gs-w="4"
            gs-h="10"
            gs-min-w="4"
            gs-min-h="4"
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
