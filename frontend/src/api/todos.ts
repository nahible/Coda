const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const TODOS_BASE_URL = `${API_BASE_URL}/todos`;

type TodoApi = {
  completed: boolean;
  created_at: string;
  id: number;
  text: string;
};

export type Todo = {
  completed: boolean;
  createdAt: string;
  id: number;
  text: string;
};

const mapTodo = (todo: TodoApi): Todo => ({
  completed: todo.completed,
  createdAt: todo.created_at,
  id: todo.id,
  text: todo.text,
});

const getErrorMessage = async (response: Response, fallbackMessage: string) => {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? fallbackMessage;
};

export async function getTodoListByUserId(): Promise<Todo[]> {
  const response = await fetch(TODOS_BASE_URL, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to fetch todos."));
  }

  const payload = (await response.json()) as { todos: TodoApi[] };
  return payload.todos.map(mapTodo);
}

export async function createTodoByUserId(text: string): Promise<Todo> {
  const response = await fetch(TODOS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create todo."));
  }

  const payload = (await response.json()) as { todo: TodoApi };
  return mapTodo(payload.todo);
}

export async function setTodoCompletedByUserId(
  todoId: number,
  completed: boolean,
): Promise<Todo> {
  const response = await fetch(`${TODOS_BASE_URL}/${todoId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ completed }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update todo."));
  }

  const payload = (await response.json()) as { todo: TodoApi };
  return mapTodo(payload.todo);
}

export async function setTodoTextByUserId(todoId: number, text: string): Promise<Todo> {
  const response = await fetch(`${TODOS_BASE_URL}/${todoId}/text`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update todo text."));
  }

  const payload = (await response.json()) as { todo: TodoApi };
  return mapTodo(payload.todo);
}

export async function deleteTodoByUserId(todoId: number): Promise<void> {
  const response = await fetch(`${TODOS_BASE_URL}/${todoId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete todo."));
  }
}

export const getTodoList = getTodoListByUserId;
export const createTodo = createTodoByUserId;
export const setTodoCompleted = setTodoCompletedByUserId;
export const setTodoText = setTodoTextByUserId;
export const deleteTodo = deleteTodoByUserId;
