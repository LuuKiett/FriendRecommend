import React from "react";
import SearchResultCard from "./SearchResultCard";

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

export default function SearchResultsPanel({
  query,
  active,
  loading,
  error,
  results,
  onSendRequest,
  onAccept,
  onReject,
  onCancel,
}) {
  const trimmedQuery = (query || "").trim();

  if (!trimmedQuery) return null;

  return (
    <section className="search-results">
      <header className="search-header">
        <div>
          <h2>Kết quả tìm kiếm cho "{trimmedQuery}"</h2>
          <span>
            {active
              ? loading
                ? "Đang quét mạng lưới để tìm đối tượng phù hợp..."
                : `${results.length} kết quả phù hợp.`
              : "Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm."}
          </span>
        </div>
      </header>

      {!active ? (
        <div className="empty-state">
          <p>Nhập thêm ký tự để tìm theo tên, sở thích hoặc thành phố.</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="suggestion-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <h3>Không tìm thấy kết quả phù hợp</h3>
          <p>Thử một từ khóa khác hoặc xem danh sách gợi ý bên dưới.</p>
        </div>
      ) : (
        <div className="suggestion-grid">
          {results.map((result) => (
            <SearchResultCard
              key={result.id}
              result={result}
              onSendRequest={onSendRequest}
              onAccept={onAccept}
              onReject={onReject}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </section>
  );
}
