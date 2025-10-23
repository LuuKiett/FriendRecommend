import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const INTEREST_OPTIONS = [
  "Công nghệ",
  "Âm nhạc",
  "Đọc sách",
  "Thể thao",
  "Chạy bộ",
  "Du lịch",
  "Nấu ăn",
  "Chụp ảnh",
  "Thiết kế",
  "Khởi nghiệp",
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
      setSuccess("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
      setForm(initialForm);
      setSelectedInterest("");
      setCustomInterest("");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        "Đăng ký thất bại, vui lòng kiểm tra lại thông tin.";
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
          <p>Tạo hồ sơ để nhận các gợi ý kết bạn chính xác hơn.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="name">Họ và tên</label>
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

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="********"
            required
          />

          <label htmlFor="city">Thành phố</label>
          <input
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="TP. Hồ Chí Minh"
          />

          <label htmlFor="headline">Giới thiệu ngắn</label>
          <input
            id="headline"
            name="headline"
            value={form.headline}
            onChange={handleChange}
            placeholder="Ví dụ: Yêu công nghệ và du lịch"
          />

          <label htmlFor="workplace">Nơi làm việc</label>
          <input
            id="workplace"
            name="workplace"
            value={form.workplace}
            onChange={handleChange}
            placeholder="Công ty ABC"
          />

          <label>Sở thích</label>
          <div className="interest-picker">
            <select
              value={selectedInterest}
              onChange={handleSelectInterest}
            >
              <option value="">Chọn sở thích</option>
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
                placeholder="Thêm sở thích khác"
              />
              <button
                type="button"
                className="button ghost"
                onClick={handleAddCustomInterest}
              >
                Thêm
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
                    aria-label={`Xóa ${interest}`}
                  >
                    x
                  </button>
                </span>
              ))}
              {form.interests.length === 0 && (
                <small className="help-text">
                  Chọn sở thích để hệ thống đề xuất những người có điểm chung.
                </small>
              )}
            </div>
          </div>

          <label htmlFor="about">Giới thiệu chi tiết</label>
          <textarea
            id="about"
            name="about"
            value={form.about}
            onChange={handleChange}
            placeholder="Chia sẻ đôi nét về bạn..."
            rows={3}
          />

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button type="submit" className="button primary" disabled={loading}>
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
