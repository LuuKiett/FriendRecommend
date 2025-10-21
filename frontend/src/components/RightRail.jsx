import React from "react";

export default function RightRail({ insights, invitations }) {
  return (
    <aside className="right-rail">
      <h6 className="mb-3">Lý do bạn thấy gợi ý này</h6>
      <ul className="ps-3">
        {insights.map((text, i) => (
          <li key={i}>{text}</li>
        ))}
      </ul>

      <hr />
      <h6 className="mb-3 mt-3">Lời mời đã gửi</h6>
      <ul className="list-unstyled">
        {invitations.map((i) => (
          <li key={i.id} className="mb-1">
            <strong>{i.name}</strong> – {i.sentAt}
          </li>
        ))}
      </ul>
    </aside>
  );
}
