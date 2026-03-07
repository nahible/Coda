import { Router } from "express";
import { getSessionUserId } from "../lib/session.js";
import {
  listTodosByUserId,
  createTodoByUserId,
  setTodoCompletedByUserId,
  setTodoTextByUserId,
  deleteTodoByUserId,
} from "../lib/todos.js";

const router = Router();

router.get("/", async (req, res) => {
  const userId = getSessionUserId(req);

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { data: todos, error } = await listTodosByUserId(userId);

  if (error) {
    res.status(500).json({ error: "Failed to fetch todos" });
    return;
  }

  res.json({ todos });
});

router.post("/", async (req, res) => {
  const userId = getSessionUserId(req);
  const text = String(req.body.text ?? "").trim();

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (!text) {
    res.status(400).json({ error: "Todo text is required" });
    return;
  }

  const { data: todo, error } = await createTodoByUserId(userId, text);

  if (error || !todo) {
    res.status(500).json({ error: "Failed to create todo" });
    return;
  }

  res.status(201).json({ todo });
});

router.patch("/:id", async (req, res) => {
  const userId = getSessionUserId(req);
  const todoId = Number(req.params.id);
  const { completed } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (!Number.isInteger(todoId)) {
    res.status(400).json({ error: "Invalid todo id" });
    return;
  }

  if (typeof completed !== "boolean") {
    res.status(400).json({ error: "completed must be a boolean" });
    return;
  }

  const { data: todo, error } = await setTodoCompletedByUserId(
    userId,
    todoId,
    completed,
  );

  if (error) {
    res.status(500).json({ error: "Failed to update todo" });
    return;
  }

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json({ todo });
});

router.patch("/:id/text", async (req, res) => {
  const userId = getSessionUserId(req);
  const todoId = Number(req.params.id);
  const text = String(req.body.text ?? "").trim();

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (!Number.isInteger(todoId)) {
    res.status(400).json({ error: "Invalid todo id" });
    return;
  }

  if (!text) {
    res.status(400).json({ error: "Todo text is required" });
    return;
  }

  const { data: todo, error } = await setTodoTextByUserId(userId, todoId, text);

  if (error) {
    res.status(500).json({ error: "Failed to update todo text" });
    return;
  }

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json({ todo });
});

router.delete("/:id", async (req, res) => {
  const userId = getSessionUserId(req);
  const todoId = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (!Number.isInteger(todoId)) {
    res.status(400).json({ error: "Invalid todo id" });
    return;
  }

  const { data: todo, error } = await deleteTodoByUserId(userId, todoId);

  if (error) {
    res.status(500).json({ error: "Failed to delete todo" });
    return;
  }

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.status(204).send();
});

export default router;
