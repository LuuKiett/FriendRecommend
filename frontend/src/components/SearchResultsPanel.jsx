import React from "react";
import SearchResultCard from "./SearchResultCard";
import GroupSearchResultCard from "./GroupSearchResultCard";

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
  userLoading = false,
  groupLoading = false,
  userError,
  groupError,
  userResults = [],
  groupResults = [],
  onSendRequest,
  onJoinGroup,
  onAccept,
  onReject,
  onCancel,
}) {
  const trimmedQuery = (query || "").trim();
  if (!trimmedQuery) return null;

  const userCount = Array.isArray(userResults) ? userResults.length : 0;
  const groupCount = Array.isArray(groupResults) ? groupResults.length : 0;
  const totalCount = userCount + groupCount;
  const isLoading = active && (userLoading || groupLoading);
  const showUsers = userCount > 0;
  const showGroups = groupCount > 0;

  return (
    <section
      className="search-results"
      id="search-results-panel"
      tabIndex={-1}
      aria-live="polite"
    >
      <header className="search-header">
        <div>
          <h2>Kết quả tìm kiếm cho “{trimmedQuery}”</h2>
          <span>
            {active
              ? isLoading
                ? "Đang quét mạng lưới để tìm đối tượng phù hợp..."
                : `${totalCount} kết quả phù hợp.`
              : "Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm."}
          </span>
        </div>
      </header>

      {!active ? (
        <div className="empty-state">
          <p>
            Nhập thêm ký tự để tìm theo tên, sở thích hoặc thành phố và xem
            trước bạn chung.
          </p>
        </div>
      ) : isLoading ? (
        <div className="suggestion-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <>
          {userError && (
            <div className="empty-state warning">
              <p>{userError}</p>
            </div>
          )}
          {groupError && (
            <div className="empty-state warning">
              <p>{groupError}</p>
            </div>
          )}
          <div className="empty-state">
            <h3>Không tìm thấy kết quả phù hợp</h3>
            <p>Thử từ khóa khác hoặc xem danh sách gợi ý bên dưới.</p>
          </div>
        </>
      ) : (
        <>
          {userError && (
            <div className="empty-state warning">
              <p>{userError}</p>
            </div>
          )}
          {showUsers && (
            <>
              <h3 className="search-subheading">Người dùng</h3>
              <div className="suggestion-grid">
                {userResults.map((result) => (
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
            </>
          )}

          {groupError && (
            <div className="empty-state warning">
              <p>{groupError}</p>
            </div>
          )}
          {showGroups && (
            <>
              <h3 className="search-subheading">Hội nhóm</h3>
              <div className="suggestion-grid group-grid">
                {groupResults.map((group) => (
                  <GroupSearchResultCard
                    key={group.id}
                    result={group}
                    onJoin={onJoinGroup}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}


