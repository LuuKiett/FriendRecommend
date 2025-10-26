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
    chips.push(`>= ${filters.mutualMin} bạn chung`);
  }
  if (filters.city && filters.city !== "all") {
    chips.push(`Thành phố: ${filters.city}`);
  }
  if (filters.interest && filters.interest !== "all") {
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
  searchEnabled,
}) {
  const chips = searchEnabled ? buildFilterSummary(filters, searchTerm) : [];
  const resultCount = searchEnabled ? suggestions.length : 0;
  const title = profile
    ? `Gợi ý kết bạn cho ${profile.name}`
    : "Gợi ý kết bạn";
  const description = searchEnabled
    ? `${resultCount} gợi ý phù hợp. Làm mới để nhận danh sách khác hoặc điều chỉnh bộ lọc để kết nối chính xác hơn.`
    : "Nhập ít nhất 2 ký tự trong ô tìm kiếm để hiển thị gợi ý phù hợp với bạn.";
  const refreshDisabled = !searchEnabled || loading;

  return (
    <section className="suggestions-wrapper">
      <header className="suggestions-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onRefresh}
          disabled={refreshDisabled}
          aria-disabled={refreshDisabled}
          title={refreshDisabled ? "Nhập từ khóa để làm mới gợi ý" : "Làm mới gợi ý"}
        >
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

      {searchEnabled ? (
        <>
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
              <button
                type="button"
                className="button primary"
                onClick={onRefresh}
                disabled={loading}
              >
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
                Điều chỉnh bộ lọc hoặc làm mới để xem thêm gợi ý mới phù hợp với nhu cầu của bạn.
              </p>
              <button
                type="button"
                className="button primary"
                onClick={onRefresh}
                disabled={loading}
              >
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
        </>
      ) : (
        <div className="empty-state">
          <h3>Tìm kiếm để xem gợi ý</h3>
          <p>
            Nhập tối thiểu 2 ký tự vào ô "Tìm kiếm bạn bè" ở thanh bên trái để hệ thống phân tích và đề xuất những kết nối phù hợp.
          </p>
        </div>
      )}
    </section>
  );
}
