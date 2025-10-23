import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const INTEREST_OPTIONS = [
  "Cong nghe",
  "Am nhac",
  "Doc sach",
  "The thao",
  "Chay bo",
  "Du lich",
  "Nau an",
  "Chup anh",
  "Thiet ke",
  "Khoi nghiep",
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  city: "",
  headline: "",
  workplace: "",
  interests: [],
  about: "",
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [selectedInterest, setSelectedInterest] = useState("");
  const [customInterest, setCustomInterest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectInterest = (event) => {
    const { value } = event.target;
    if (!value) return;
    const exists = form.interests.some(
      (interest) => interest.toLowerCase() === value.toLowerCase()
    );
    if (!exists) {
      setForm((prev) => ({
        ...prev,
        interests: [...prev.interests, value],
      }));
    }
    setSelectedInterest("");
  };

  const handleAddCustomInterest = () => {
    const value = customInterest.trim();
    if (!value) return;
    const exists = form.interests.some(
      (interest) => interest.toLowerCase() === value.toLowerCase()
    );
    if (!exists) {
      setForm((prev) => ({
        ...prev,
        interests: [...prev.interests, value],
      }));
    }
    setCustomInterest("");
  };

  const handleRemoveInterest = (value) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((interest) => interest !== value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      ...form,
      interests: form.interests,
    };

    try {
      await api.post("/auth/register", payload);
      setSuccess("Dang ky thanh cong! Ban co the dang nhap ngay bay gio.");
      setForm(initialForm);
      setSelectedInterest("");
      setCustomInterest("");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        "Dang ky that bai, vui long kiem tra lai thong tin.";
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
          <p>Tao ho so de nhan cac goi y ket ban chinh xac hon.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="name">Ho va ten</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nguyen Minh An"
            required
          />

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

          <label htmlFor="city">Thanh pho</label>
          <input
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="TP. Ho Chi Minh"
          />

          <label htmlFor="headline">Gioi thieu ngan</label>
          <input
            id="headline"
            name="headline"
            value={form.headline}
            onChange={handleChange}
            placeholder="Vi du: Yeu cong nghe va du lich"
          />

          <label htmlFor="workplace">Noi lam viec</label>
          <input
            id="workplace"
            name="workplace"
            value={form.workplace}
            onChange={handleChange}
            placeholder="Cong ty ABC"
          />

          <label>So thich</label>
          <div className="interest-picker">
            <select
              value={selectedInterest}
              onChange={handleSelectInterest}
            >
              <option value="">Chon so thich</option>
              {INTEREST_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="interest-custom">
              <input
                type="text"
                value={customInterest}
                onChange={(event) => setCustomInterest(event.target.value)}
                placeholder="Them so thich khac"
              />
              <button
                type="button"
                className="button ghost"
                onClick={handleAddCustomInterest}
              >
                Them
              </button>
            </div>
            <div className="selected-interests">
              {form.interests.map((interest) => (
                <span key={interest} className="chip">
                  {interest}
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => handleRemoveInterest(interest)}
                    aria-label={`Xoa ${interest}`}
                  >
                    x
                  </button>
                </span>
              ))}
              {form.interests.length === 0 && (
                <small className="help-text">
                  Chon so thich de he thong de xuat nhung nguoi co diem chung.
                </small>
              )}
            </div>
          </div>

          <label htmlFor="about">Gioi thieu chi tiet</label>
          <textarea
            id="about"
            name="about"
            value={form.about}
            onChange={handleChange}
            placeholder="Chia se doi net ve ban..."
            rows={3}
          />

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button type="submit" className="button primary" disabled={loading}>
            {loading ? "Dang tao tai khoan..." : "Dang ky"}
          </button>
        </form>

        <p className="auth-footer">
          Da co tai khoan? <Link to="/login">Dang nhap</Link>
        </p>
      </div>
    </div>
  );
}
