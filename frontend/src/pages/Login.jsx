import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        "Sai thong tin dang nhap. Vui long thu lai.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>FriendConnect</h1>
          <p>Dang nhap de tiep tuc ket noi voi nhung nguoi ban moi.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="nhanvien@example.com"
            required
          />

          <label htmlFor="password">Mat khau</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="********"
            required
          />

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="button primary" disabled={loading}>
            {loading ? "Dang dang nhap..." : "Dang nhap"}
          </button>
        </form>

        <p className="auth-footer">
          Chua co tai khoan? <Link to="/register">Dang ky ngay</Link>
        </p>
      </div>
    </div>
  );
}
