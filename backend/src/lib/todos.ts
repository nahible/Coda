import { supabase } from "./supabase.js";

const TODO_COLUMNS = "id, text, completed, created_at";

export const listTodosByUserId = async (userId: number) => {
  return supabase
    .from("todos")
    .select(TODO_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
};

export const createTodoByUserId = async (userId: number, text: string) => {
  return supabase
    .from("todos")
    .insert({ user_id: userId, text, completed: false })
    .select(TODO_COLUMNS)
    .single();
};

export const setTodoCompletedByUserId = async (
  userId: number,
  todoId: number,
  completed: boolean,
) => {
  return supabase
    .from("todos")
    .update({
      completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", todoId)
    .eq("user_id", userId)
    .select(TODO_COLUMNS)
    .maybeSingle();
};

export const setTodoTextByUserId = async (
  userId: number,
  todoId: number,
  text: string,
) => {
  return supabase
    .from("todos")
    .update({
      text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", todoId)
    .eq("user_id", userId)
    .select("id, text, completed, created_at")
    .maybeSingle();
};

export const deleteTodoByUserId = async (userId: number, todoId: number) => {
  return supabase
    .from("todos")
    .delete()
    .eq("id", todoId)
    .eq("user_id", userId)
    .select(TODO_COLUMNS)
    .maybeSingle();
};
