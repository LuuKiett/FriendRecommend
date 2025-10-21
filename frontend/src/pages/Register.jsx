import React, { useState } from "react";
import { api } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", form);
      alert("Đăng ký thành công! Hãy đăng nhập.");
      nav("/login");
    } catch {
      alert("Đăng ký thất bại, email có thể đã tồn tại.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Tạo tài khoản mới</h2>
        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-2"
            placeholder="Họ tên"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="form-control mb-2"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="form-control mb-3"
            type="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button className="btn btn-success w-100">Đăng ký</button>
        </form>
        <p className="text-center mt-2">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
