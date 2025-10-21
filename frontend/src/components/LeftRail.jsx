import React from "react";

export default function LeftRail({ filters }) {
  return (
    <aside className="left-rail">
      <h6 className="mb-3">Bộ lọc gợi ý</h6>
      {filters.map((f) => (
        <div key={f.id} className="form-check mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            defaultChecked={f.active}
            id={f.id}
          />
          <label htmlFor={f.id} className="form-check-label">
            {f.label}
          </label>
        </div>
      ))}
    </aside>
  );
}
