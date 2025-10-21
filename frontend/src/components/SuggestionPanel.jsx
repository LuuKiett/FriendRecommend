import React, { useState } from "react";
import useFriendSuggestions from "../hooks/useFriendSuggestions";
import SuggestionCard from "./SuggestionCard";

export default function SuggestionPanel() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [name] = useState(user?.name || "Kiet");
  const { visibleSuggestions, loading, sendRequest, hideUser } =
    useFriendSuggestions(name);

  return (
    <div className="suggestions-wrapper">
      <h4 className="fw-bold text-primary mb-3">Gợi ý bạn bè cho {name}</h4>

      {loading ? (
        <p>⏳ Đang tải danh sách...</p>
      ) : visibleSuggestions.length === 0 ? (
        <p>Không có gợi ý nào.</p>
      ) : (
        <div className="row g-4">
          {visibleSuggestions.map((person) => (
            <div key={person} className="col-lg-4 col-md-6">
              <SuggestionCard
                person={person}
                onAdd={sendRequest}
                onHide={hideUser}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
