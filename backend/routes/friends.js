import express from "express";
import driver from "../neo4j.js";

const router = express.Router();

/**
 * ✅ Kết bạn (2 chiều)
 * body: { a: "Kiet", b: "Huy" }
 */
router.post("/add", async (req, res) => {
  const { a, b } = req.body;
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (u1:User {name:$a}), (u2:User {name:$b})
      MERGE (u1)-[:FRIEND_WITH]->(u2)
      MERGE (u2)-[:FRIEND_WITH]->(u1)
      `,
      { a, b }
    );

    res.json({ success: true, message: `${a} và ${b} đã trở thành bạn bè!` });
  } catch (err) {
    console.error("❌ Lỗi kết bạn:", err);
    res.status(500).json({ error: "Kết bạn thất bại!" });
  } finally {
    await session.close();
  }
});

/**
 * ✅ Lấy danh sách bạn bè của user
 * GET /api/friends/:name
 */
router.get("/:name", async (req, res) => {
  const { name } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {name:$name})-[:FRIEND_WITH]->(f:User)
      RETURN f.name AS friend
      `,
      { name }
    );

    res.json(result.records.map((r) => r.get("friend")));
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách bạn bè:", err);
    res.status(500).json({ error: "Không lấy được danh sách bạn bè!" });
  } finally {
    await session.close();
  }
});

/**
 * ✅ Gợi ý bạn bè (friend of friends)
 * GET /api/friends/recommend/:name
 */
router.get("/recommend/:name", async (req, res) => {
  const { name } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (me:User {name:$name})-[:FRIEND_WITH]->(f)-[:FRIEND_WITH]->(s)
      WHERE NOT (me)-[:FRIEND_WITH]->(s) AND me <> s
      RETURN DISTINCT s.name AS name
      `
    );

    res.json(result.records.map((r) => r.get("name")));
  } catch (err) {
    console.error("❌ Lỗi gợi ý bạn bè:", err);
    res.status(500).json({ error: "Không thể gợi ý bạn bè!" });
  } finally {
    await session.close();
  }
});

/**
 * ✅ Gợi ý theo sở thích
 * GET /api/friends/recommend-interest/:name
 */
router.get("/recommend-interest/:name", async (req, res) => {
  const { name } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (me:User {name:$name}), (u:User)
      WHERE me <> u AND size(apoc.coll.intersection(me.interests, u.interests)) > 0
      RETURN u.name AS name, apoc.coll.intersection(me.interests, u.interests) AS shared
      `
    );

    res.json(
      result.records.map((r) => ({
        name: r.get("name"),
        shared: r.get("shared"),
      }))
    );
  } catch (err) {
    console.error("❌ Lỗi gợi ý theo sở thích:", err);
    res.status(500).json({ error: "Không thể gợi ý theo sở thích!" });
  } finally {
    await session.close();
  }
});

export default router;
