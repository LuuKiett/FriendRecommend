import React from "react";

export default function SuggestionCard({ person, onAdd, onHide }) {
  return (
    <div className="friend-card">
      <div className="friend-avatar">
        <img src={`https://i.pravatar.cc/200?u=${person}`} alt={person} />
      </div>
      <div className="friend-info">
        <h5>{person}</h5>
        <p className="mutual">3 bạn chung</p>
        <div className="actions">
          <button className="btn btn-primary btn-sm" onClick={() => onAdd(person)}>
            <i className="fa-solid fa-user-plus me-1"></i> Thêm bạn
          </button>
          <button className="btn btn-light btn-sm" onClick={() => onHide(person)}>
            <i className="fa-solid fa-xmark me-1"></i> Ẩn
          </button>
        </div>
      </div>
    </div>
  );
}
