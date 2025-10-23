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
          <h2>Ket qua tim kiem cho "{trimmedQuery}"</h2>
          <span>
            {active
              ? loading
                ? "Dang quet mang luoi de tim doi tuong phu hop..."
                : `${results.length} ket qua phu hop.`
              : "Nhap it nhat 2 ky tu de bat dau tim kiem."}
          </span>
        </div>
      </header>

      {!active ? (
        <div className="empty-state">
          <p>Nhap them ky tu de tim theo ten, so thich hoac thanh pho.</p>
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
          <h3>Khong tim thay ket qua phu hop</h3>
          <p>Thu mot tu khoa khac hoac xem danh sach goi y ben duoi.</p>
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
