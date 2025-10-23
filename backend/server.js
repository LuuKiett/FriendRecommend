import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import friendRoutes from "./routes/friends.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/friends", authMiddleware, friendRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${process.env.PORT}`);
});
