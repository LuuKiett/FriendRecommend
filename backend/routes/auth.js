import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import driver from "../neo4j.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
const SECRET = "friend_secret_2025";

const formatNeoDateTime = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value.toString === "function") return value.toString();
  return null;
};

const buildProfile = (node) => {
  if (!node) return null;
  const props = node.properties ?? node;
  const fallbackId = node.elementId || node.identity?.toString();
  return {
    id: props.id || fallbackId,
    name: props.name,
    email: props.email,
    city: props.city,
    headline: props.headline,
    workplace: props.workplace,
    avatar: props.avatar,
    about: props.about,
    interests: props.interests || [],
    createdAt: formatNeoDateTime(props.createdAt),
    lastActive: formatNeoDateTime(props.lastActive),
  };
};

const normalizeInterests = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    city,
    headline,
    workplace,
    about,
    interests,
    avatar,
  } = req.body;
  const session = driver.session();

  try {
    const hashed = password;

    const existing = await session.run(
      `MATCH (u:User {email: $email}) RETURN u`,
      { email }
    );
    if (existing.records.length > 0) {
      return res
        .status(400)
        .json({ error: "Email đã tồn tại. Vui lòng dùng email khác." });
    }

    const generatedAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(
        name || email
      )}`;

    await session.run(
      `
      CREATE (u:User {
        id: $id,
        name: $name,
        email: $email,
        password: $password,
        city: $city,
        headline: $headline,
        workplace: $workplace,
        about: $about,
        interests: $interests,
        avatar: $avatar,
        createdAt: datetime(),
        lastActive: datetime()
      })
      `,
      {
        id: randomUUID(),
        name,
        email,
        password: hashed,
        city: city ?? null,
        headline: headline ?? null,
        workplace: workplace ?? null,
        about: about ?? null,
        interests: normalizeInterests(interests),
        avatar: generatedAvatar,
      }
    );

    res.json({
      success: true,
      message: "Đăng ký thành công. Bạn có thể đăng nhập ngay.",
    });
  } catch (err) {
    console.error("Register error:", err);
    res
      .status(500)
      .json({ error: "Đăng ký thất bại. Vui lòng thử lại sau." });
  } finally {
    await session.close();
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (u:User {email: $email}) RETURN u`,
      { email }
    );

    if (result.records.length === 0) {
      return res
        .status(401)
        .json({ error: "Không tìm thấy tài khoản với email này." });
    }

    const userNode = result.records[0].get("u");
    const user = userNode.properties;

    // ⚠️ Bỏ bcrypt.compare, so sánh trực tiếp password
    if (user.password !== password) {
      return res.status(401).json({ error: "Mật khẩu không chính xác." });
    }

    const token = jwt.sign(
      { name: user.name, email: user.email },
      SECRET,
      { expiresIn: "3h" }
    );

    res.json({
      token,
      user: buildProfile(userNode),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Đăng nhập thất bại. Thử lại sau." });
  } finally {
    await session.close();
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (u:User {email: $email}) RETURN u`,
      { email: req.user.email }
    );

    if (!result.records.length) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }

    res.json(buildProfile(result.records[0].get("u")));
  } catch (err) {
    console.error("Fetch profile error:", err);
    res
      .status(500)
      .json({ error: "Không thể tải thông tin người dùng." });
  } finally {
    await session.close();
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  const {
    name,
    city,
    headline,
    workplace,
    about,
    avatar,
    interests,
  } = req.body;

  const updates = {};
  const assignIfDefined = (field, value) => {
    if (typeof value !== "undefined") {
      updates[field] = value === "" ? null : value;
    }
  };

  assignIfDefined("name", name);
  assignIfDefined("city", city);
  assignIfDefined("headline", headline);
  assignIfDefined("workplace", workplace);
  assignIfDefined("about", about);
  assignIfDefined("avatar", avatar);
  if (typeof interests !== "undefined") {
    updates.interests = normalizeInterests(interests);
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {email: $email})
      SET u += $updates
      SET u.lastActive = datetime()
      RETURN u
      `,
      { email: req.user.email, updates }
    );

    if (!result.records.length) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }

    res.json({
      success: true,
      user: buildProfile(result.records[0].get("u")),
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res
      .status(500)
      .json({ error: "Không thể cập nhật thông tin người dùng." });
  } finally {
    await session.close();
  }
});

export default router;
