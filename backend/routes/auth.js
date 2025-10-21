import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import driver from "../neo4j.js";

const router = express.Router();
const SECRET = "friend_secret_2025";

// ✅ Đăng ký
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const session = driver.session();

  try {
    // Băm mật khẩu
    const hashed = await bcrypt.hash(password, 10);

    // Kiểm tra tồn tại email
    const existing = await session.run(
      `MATCH (u:User {email:$email}) RETURN u`,
      { email }
    );
    if (existing.records.length > 0) {
      return res.status(400).json({ error: "Email đã tồn tại!" });
    }

    // Tạo user
    await session.run(
      `
      CREATE (u:User {
        name:$name,
        email:$email,
        password:$password,
        createdAt:datetime()
      })
      `,
      { name, email, password: hashed }
    );

    res.json({ success: true, message: "Đăng ký thành công!" });
  } catch (err) {
    console.error("❌ Lỗi đăng ký:", err);
    res.status(500).json({ error: "Đăng ký thất bại!" });
  } finally {
    await session.close();
  }
});

// ✅ Đăng nhập
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (u:User {email:$email}) RETURN u`,
      { email }
    );

    if (result.records.length === 0)
      return res.status(401).json({ error: "Email không tồn tại!" });

    const user = result.records[0].get("u").properties;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Sai mật khẩu!" });

    const token = jwt.sign(
      { name: user.name, email: user.email },
      SECRET,
      { expiresIn: "3h" }
    );

    res.json({
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err);
    res.status(500).json({ error: "Đăng nhập thất bại!" });
  } finally {
    await session.close();
  }
});

export default router;
