import React from "react";
import SuggestionCard from "./SuggestionCard";

const SkeletonCard = () => (
  <div className="friend-card skeleton">
    <div className="friend-card__media skeleton-block" />
    <div className="friend-card__body">
      <div className="skeleton-line short" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </div>
    <div className="friend-card__actions">
      <div className="skeleton-pill" />
      <div className="skeleton-pill ghost" />
    </div>
  </div>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
    <path
      d="M10 3a7 7 0 014.95 2.05l.7-.7a1 1 0 011.4 1.42l-2.5 2.5a1 1 0 01-1.42 0l-2.5-2.5a1 1 0 011.42-1.42l.52.52A5 5 0 105 10a1 1 0 11-2 0A7 7 0 0110 3z"
      fill="currentColor"
    />
  </svg>
);

const buildFilterSummary = (filters, searchTerm) => {
  const chips = [];
  if (filters.mutualMin > 0) {
    chips.push(`≥ ${filters.mutualMin} bạn chung`);
  }
  if (filters.city !== "all") {
    chips.push(`Thành phố: ${filters.city}`);
  }
  if (filters.interest !== "all") {
    chips.push(`Sở thích: ${filters.interest}`);
  }
  if (searchTerm) {
    chips.push(`Từ khóa: "${searchTerm}"`);
  }
  return chips;
};

export default function SuggestionPanel({
  profile,
  suggestions,
  loading,
  error,
  onSendRequest,
  onDismiss,
  onRefresh,
  lastAction,
  filters,
  searchTerm,
}) {
  const chips = buildFilterSummary(filters, searchTerm);
  const resultCount = suggestions.length;
  const title = profile
    ? `Gợi ý kết bạn cho ${profile.name}`
    : "Gợi ý kết bạn";

  return (
    <section className="suggestions-wrapper">
      <header className="suggestions-header">
        <div>
          <h2>{title}</h2>
          <p>
            {resultCount} gợi ý phù hợp. Làm mới để nhận danh sách khác
            hoặc điều chỉnh bộ lọc để kết nối chính xác hơn.
          </p>
        </div>
        <button type="button" className="icon-button" onClick={onRefresh}>
          <RefreshIcon />
        </button>
      </header>

      {chips.length > 0 && (
        <div className="active-filters">
          {chips.map((chip) => (
            <span key={chip} className="chip">
              {chip}
            </span>
          ))}
        </div>
      )}

      {lastAction?.type === "dismiss" && (
        <div className="inline-info">
          Đã ẩn một gợi ý khỏi danh sách của bạn.
        </div>
      )}
      {lastAction?.type === "request" && (
        <div className="inline-success">
          Đã gửi lời mời kết bạn thành công.
        </div>
      )}

      {error ? (
        <div className="empty-state">
          <p>{error}</p>
          <button type="button" className="button primary" onClick={onRefresh}>
            Thử lại
          </button>
        </div>
      ) : loading ? (
        <div className="suggestion-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : resultCount === 0 ? (
        <div className="empty-state">
          <h3>Danh sách hiện đang trống</h3>
          <p>
            Thử nới lỏng bộ lọc hoặc làm mới để xem nhiều gợi ý mới hơn.
          </p>
          <button type="button" className="button primary" onClick={onRefresh}>
            Làm mới gợi ý
          </button>
        </div>
      ) : (
        <div className="suggestion-grid">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAdd={onSendRequest}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}
    </section>
  );
}
