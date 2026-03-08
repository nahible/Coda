import { useState, useEffect, useRef } from 'react';
import { GridStack } from 'gridstack';
import type { AuthUser } from '../api/auth';
import Sidebar from '../components/Sidebar';
import SpotifyPlayer from '../components/SpotifyPlayer';
import PomodoroTimer from '../components/PomodoroTimer';
import TodoList from '../components/TodoList';
import ChatBot from '../components/ChatBot';
import type { Todo } from '../components/TodoList';

const initialTodos: Todo[] = [
  { id: 1, text: 'Review project requirements', done: false },
  { id: 2, text: 'Set up development environment', done: true },
  { id: 3, text: 'Design component architecture', done: false },
];

type HomePageProps = {
  onLogout: () => void | Promise<void>;
  user: AuthUser;
};

export default function HomePage({ onLogout, user }: HomePageProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
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
            handles: 'se',
          },
        },
        gridRef.current
      );

      // Forcefully apply minimum size constraints that HTML attributes sometimes drop
      const spotifyEl = document.getElementById('spotify-item');
      if (spotifyEl && gridInstanceRef.current) {
        gridInstanceRef.current.update(spotifyEl, { minW: 3, minH: 4 });
      }

      const pomodoroEl = document.getElementById('pomodoro-item');
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

  return (
    <div className="flex h-screen p-6 gap-6" id="app-shell">
      {/* Sidebar — outside the grid */}
      <Sidebar onLogout={onLogout} user={user} />

      {/* Gridstack Bento Grid */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid-stack" ref={gridRef}>
          {/* Spotify Player */}
          <div className="grid-stack-item" id="spotify-item" gs-x="0" gs-y="0" gs-w="4" gs-h="6" gs-min-w="4" gs-min-h="5">
            <div className="grid-stack-item-content">
              <SpotifyPlayer />
            </div>
          </div>

          {/* Pomodoro Timer */}
          <div className="grid-stack-item" id="pomodoro-item" gs-x="0" gs-y="6" gs-w="4" gs-h="8" gs-min-w="2" gs-min-h="4">
            <div className="grid-stack-item-content">
              <PomodoroTimer />
            </div>
          </div>

          {/* Todo List */}
          <div className="grid-stack-item" gs-x="0" gs-y="14" gs-w="4" gs-h="6" gs-min-w="3" gs-min-h="4">
            <div className="grid-stack-item-content">
              <TodoList todos={todos} setTodos={setTodos} />
            </div>
          </div>

          {/* ChatBot */}
          <div className="grid-stack-item" gs-x="4" gs-y="0" gs-w="8" gs-h="20" gs-min-w="4" gs-min-h="8">
            <div className="grid-stack-item-content">
              <ChatBot todos={todos} setTodos={setTodos} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
