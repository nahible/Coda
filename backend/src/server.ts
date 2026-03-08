import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import chatbotRouter from "./routes/chatbot.js";
import canvasRouter from "./routes/canvas.js";
import todoRouter from "./routes/todo.js";
import spotifyRouter from "./routes/spotify.js";

const app = express();
const PORT = Number(process.env.PORT || 5001);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Mount auth routes at /auth
app.use("/auth", authRouter);
app.use("/chatbot", chatbotRouter);
app.use("/canvas", canvasRouter);
app.use("/todos", todoRouter);

// Mount spotify routes at /auth/spotify
app.use("/auth/spotify", spotifyRouter);

app.get("/", (req, res) => {
  res.send("Coda Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
