import React from "react";
import Topbar from "../components/Topbar";
import LeftRail from "../components/LeftRail";
import RightRail from "../components/RightRail";
import SuggestionPanel from "../components/SuggestionPanel";

export default function Home() {
  const quickFilters = [
    { id: "mutual-5", label: "Bạn chung > 5", active: true },
    { id: "same-city", label: "Cùng khu vực", active: false },
    { id: "recent-active", label: "Đang hoạt động", active: false },
    { id: "joined-this-week", label: "Vừa tham gia", active: false },
  ];

  const insights = ["Bạn và họ có cùng bạn chung.", "Đang hoạt động gần đây."];
  const pendingInvitations = [
    { id: 1, name: "Nam Nguyễn", sentAt: "2 ngày trước" },
    { id: 2, name: "Lan Phạm", sentAt: "Hôm qua" },
  ];

  return (
    <div>
      <Topbar />
      <div className="content-wrapper">
        <LeftRail filters={quickFilters} />
        <main className="main-column">
          <SuggestionPanel />
        </main>
        <RightRail insights={insights} invitations={pendingInvitations} />
      </div>
    </div>
  );
}
