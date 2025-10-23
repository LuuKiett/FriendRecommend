import jwt from "jsonwebtoken";

const SECRET = "friend_secret_2025";

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ error: "Thiếu token xác thực. Vui lòng đăng nhập lại." });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token không hợp lệ." });
  }
}
