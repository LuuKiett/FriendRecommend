import React from "react";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.clear();
    nav("/login");
  };

  return (
    <header className="topbar">
      <h5>FriendConnect</h5>
      <div>
        <span className="me-3 fw-semibold">{user?.name}</span>
        <button onClick={logout} className="btn btn-outline-danger btn-sm">
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
