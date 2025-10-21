import express from "express";
import cors from "cors";
import driver from "./neo4j.js";
import authRoutes from "./routes/auth.js";
import friendRoutes from "./routes/friends.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/friends", authMiddleware, friendRoutes);

// ✅ 1. Tạo user mới
app.post("/users", async (req, res) => {
  const { name, city, interests } = req.body;
  const session = driver.session();
  try {
    await session.run(
      "CREATE (:User {name:$name, city:$city, interests:$interests})",
      { name, city, interests }
    );
    res.json({ success: true, message: "Tạo user thành công" });
  } finally {
    await session.close();
  }
});

// ✅ 2. Tạo quan hệ bạn bè
app.post("/friend", async (req, res) => {
  const { a, b } = req.body;
  const session = driver.session();
  try {
    await session.run(`
      MATCH (u1:User {name:$a}), (u2:User {name:$b})
      CREATE (u1)-[:FRIEND_WITH]->(u2),
             (u2)-[:FRIEND_WITH]->(u1)
    `, { a, b });
    res.json({ success: true });
  } finally {
    await session.close();
  }
});

// ✅ 3. Gợi ý bạn của bạn (Friend of Friend)
app.get("/api/recommend/:name", async (req, res) => {
  const { name } = req.params;
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (me:User {name:$name})-[:FRIEND_WITH]->(f)-[:FRIEND_WITH]->(s)
      WHERE NOT (me)-[:FRIEND_WITH]->(s) AND me <> s
      RETURN DISTINCT s.name AS name
    `, { name });
    res.json(result.records.map(r => r.get("name")));
  } finally {
    await session.close();
  }
});

// ✅ 4. Gợi ý theo sở thích
app.get("/api/recommend-interest/:name", async (req, res) => {
  const { name } = req.params;
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (me:User {name:$name}), (u:User)
      WHERE me <> u AND size(apoc.coll.intersection(me.interests, u.interests)) > 0
      RETURN u.name AS name, apoc.coll.intersection(me.interests, u.interests) AS shared
    `, { name });
    res.json(result.records.map(r => ({
      name: r.get("name"),
      shared: r.get("shared")
    })));
  } finally {
    await session.close();
  }
});

app.listen(process.env.PORT, () =>
  console.log(`🚀 Server đang chạy tại http://localhost:${process.env.PORT}`)
);
