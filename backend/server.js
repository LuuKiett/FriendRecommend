import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import friendRoutes from "./routes/friends.js";
import postRoutes from "./routes/posts.js";
import groupRoutes from "./routes/groups.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/friends", authMiddleware, friendRoutes);
app.use("/api/posts", authMiddleware, postRoutes);
app.use("/api/groups", authMiddleware, groupRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Máy chủ đang chạy tại http://localhost:${PORT}`);
});
