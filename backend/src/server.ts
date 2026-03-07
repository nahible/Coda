import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = Number(process.env.PORT || 5001);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Mount auth routes at /auth
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Coda Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
