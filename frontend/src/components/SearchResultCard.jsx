import React, { useState } from "react";

const fallbackAvatar =
  "https://api.dicebear.com/7.x/thumbs/svg?seed=friend-search";

const Icon = ({ path }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <path fill="currentColor" d={path} />
  </svg>
);

const ICONS = {
  location:
    "M12 2a7 7 0 00-7 7c0 5.28 7 13 7 13s7-7.72 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 112.5-2.5 2.5 2.5 0 01-2.5 2.5z",
  workplace:
    "M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2zm4-5h8a2 2 0 012 2v3H6V4a2 2 0 012-2z",
  people:
    "M16 11a4 4 0 10-4-4 4 4 0 004 4zm-8 0a4 4 0 10-4-4 4 4 0 004 4zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm8 0c-.34 0-.7.02-1.06.05A6.49 6.49 0 0120 19v3h8v-3c0-2.66-5.33-4-8-4z",
};

const STATUS_LABELS = {
  none: "Chưa kết nối",
  friend: "Đã là bạn bè",
  incoming: "Đang chờ bạn",
  outgoing: "Đang chờ phản hồi",
};

const STATUS_CLASS = {
  none: "status-none",
  friend: "status-friend",
  incoming: "status-incoming",
  outgoing: "status-outgoing",
};

export default function SearchResultCard({
  result,
  onSendRequest,
  onAccept,
  onReject,
  onCancel,
}) {
  const [pendingAction, setPendingAction] = useState(false);

  const avatar = result.avatar || fallbackAvatar;
  const mutualNames = (result.mutualFriends || [])
    .map((friend) => friend.name)
    .filter(Boolean);
  const mutualPreview = mutualNames.slice(0, 3).join(", ");
  const hasMoreMutual = mutualNames.length > 3;
  const sharedInterests = Array.isArray(result.sharedInterests)
    ? result.sharedInterests.filter(Boolean)
    : [];
  const interests = Array.isArray(result.interests)
    ? result.interests.filter(Boolean)
    : [];
  const displayInterests =
    interests.length > 0 ? interests.slice(0, 4) : sharedInterests.slice(0, 4);
  const sharedInterestSet = new Set(
    sharedInterests.map((interest) => interest.trim())
  );
  const statusLabel = STATUS_LABELS[result.status] || "";
  const statusClass = STATUS_CLASS[result.status] || "status-none";

  const handleAsync = async (callback, ...args) => {
    if (!callback) return;
    setPendingAction(true);
    try {
      await callback(...args);
    } finally {
      setPendingAction(false);
    }
  };

  const renderActions = () => {
    switch (result.status) {
      case "friend":
        return (
          <button type="button" className="button ghost" disabled>
            {statusLabel}
          </button>
        );
      case "incoming":
        return (
          <>
            <button
              type="button"
              className="button primary"
              disabled={pendingAction}
              onClick={() =>
                handleAsync(onAccept, result.request?.id, result.id)
              }
            >
              {pendingAction ? "Đang xử lý..." : "Chấp nhận"}
            </button>
            <button
              type="button"
              className="button ghost"
              disabled={pendingAction}
              onClick={() =>
                handleAsync(onReject, result.request?.id, result.id)
              }
            >
              Bỏ qua
            </button>
          </>
        );
      case "outgoing":
        return (
          <button
            type="button"
            className="button ghost"
            disabled={pendingAction}
            onClick={() => handleAsync(onCancel, result.request?.id, result.id)}
          >
            {pendingAction ? "Đang hủy..." : "Hủy lời mời"}
          </button>
        );
      default:
        return (
          <button
            type="button"
            className="button primary"
            disabled={pendingAction}
            onClick={() => handleAsync(onSendRequest, result.id)}
          >
            {pendingAction ? "Đang gửi..." : "Kết bạn"}
          </button>
        );
    }
  };

  return (
    <article className="friend-card search-card">
      <div className="friend-card__media">
        <img src={avatar} alt={result.name} />
        {statusLabel && (
          <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
        )}
      </div>
      <div className="friend-card__body">
        <header>
          <h2>{result.name}</h2>
          {result.headline && <p>{result.headline}</p>}
        </header>
        <ul className="friend-card__meta">
          {result.city && (
            <li>
              <Icon path={ICONS.location} />
              {result.city}
            </li>
          )}
          {result.workplace && (
            <li>
              <Icon path={ICONS.workplace} />
              {result.workplace}
            </li>
          )}
          <li>
            <Icon path={ICONS.people} />
            {result.mutualCount} bạn chung
            {mutualPreview && (
              <small>
                {" "}
                ({mutualPreview}
                {hasMoreMutual ? ", ..." : ""})
              </small>
            )}
          </li>
        </ul>
        {displayInterests.length > 0 && (
          <div className="friend-card__tags">
            {displayInterests.map((interest) => {
              const label = interest.trim();
              const isShared = sharedInterestSet.has(label);
              return (
                <span key={label} className="chip">
                  {label}
                  {isShared ? " (chung)" : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <footer className="search-card__actions">{renderActions()}</footer>
    </article>
  );
}

