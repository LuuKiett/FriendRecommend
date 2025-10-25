import React, { useMemo, useState } from "react";
import GroupSuggestionCard from "./GroupSuggestionCard";

const defaultAvatar =
  "https://api.dicebear.com/7.x/thumbs/svg?seed=request-user";

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Vừa xong";
  if (diff < hour) {
    const minutes = Math.round(diff / minute);
    return `${minutes} phút trước`;
  }
  if (diff < day) {
    const hours = Math.round(diff / hour);
    return `${hours} giờ trước`;
  }
  const days = Math.round(diff / day);
  return `${days} ngày trước`;
};

const StatTile = ({ label, value }) => (
  <div className="stat-tile">
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);

const ChipList = ({ items, placeholder }) => {
  if (!items || items.length === 0) {
    return <p className="empty-message">{placeholder}</p>;
  }
  return (
    <div className="chip-list">
      {items.map((item) => (
        <span key={item.value || item} className="chip">
          {item.value || item}
          {item.count ? <small>{item.count}</small> : null}
        </span>
      ))}
    </div>
  );
};

const RequestItem = ({
  request,
  onAccept = () => {},
  onReject = () => {},
  onCancel = () => {},
  variant,
}) => {
  const user = request.user;
  const avatar = user?.avatar || defaultAvatar;
  const relativeTime = formatRelativeTime(request.createdAt);

  return (
    <li className="request-item">
      <img src={avatar} alt={user?.name} />
      <div className="request-body">
        <strong>{user?.name}</strong>
        {user?.headline && <p>{user.headline}</p>}
        <div className="request-meta">
          {relativeTime && <span>{relativeTime}</span>}
          {user?.city && <span>{user.city}</span>}
        </div>
        {request.message && (
          <p className="request-message">"{request.message}"</p>
        )}
      </div>
      <div className="request-actions">
        {variant === "incoming" ? (
          <>
            <button
              type="button"
              className="button primary"
              onClick={() => onAccept(request.id)}
            >
              Chấp nhận
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => onReject(request.id)}
            >
              Bỏ qua
            </button>
          </>
        ) : (
          <button
            type="button"
            className="button ghost"
            onClick={() => onCancel(request.id)}
          >
            Hủy lời mời
          </button>
        )}
      </div>
    </li>
  );
};

const SharedInterestItem = ({ suggestion, onSendRequest }) => {
  const [pending, setPending] = useState(false);
  const shared = (suggestion.sharedInterests || []).slice(0, 4);
  const mutualPreview = (suggestion.mutualFriends || [])
    .map((friend) => friend.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  const handleSend = async () => {
    if (!onSendRequest || pending) return;
    setPending(true);
    try {
      await onSendRequest(suggestion.id);
    } finally {
      setPending(false);
    }
  };

  return (
    <li className="interest-suggestion">
      <div className="interest-suggestion__body">
        <strong>{suggestion.name}</strong>
        {suggestion.headline && <p>{suggestion.headline}</p>}
        <div className="request-meta">
          {suggestion.city && <span>{suggestion.city}</span>}
          {suggestion.mutualCount > 0 && (
            <span>
              {suggestion.mutualCount} bạn chung
              {mutualPreview ? ` (${mutualPreview})` : ""}
            </span>
          )}
        </div>
        {shared.length > 0 && (
          <div className="friend-card__tags">
            {shared.map((interest) => (
              <span key={interest} className="chip">
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        className="button primary"
        onClick={handleSend}
        disabled={pending}
      >
        {pending ? "Đang gửi..." : "Kết bạn"}
      </button>
    </li>
  );
};

export default function RightRail({
  insights,
  insightsLoading,
  insightsError,
  requests = { incoming: [], outgoing: [] },
  requestsLoading,
  requestsError,
  onAccept = () => {},
  onReject = () => {},
  onCancel = () => {},
  groupSuggestions = [],
  groupsLoading = false,
  groupsError = null,
  onJoinGroup,
  pendingGroups,
  sharedInterestSuggestions = [],
  sharedInterestLoading = false,
  sharedInterestError = null,
  onSendRequest,
  onRefreshSharedInterests,
}) {
  const groupPending = pendingGroups || new Set();

  const stats = useMemo(() => {
    if (!insights) return [];
    return [
      { label: "Bạn bè", value: insights.friendCount },
      { label: "Lời mời đến", value: insights.incomingCount },
      { label: "Đã gửi", value: insights.outgoingCount },
      { label: "Gợi ý", value: insights.suggestionCount },
      { label: "Bài viết đã đăng", value: insights.postCount ?? 0 },
      { label: "Nhóm tham gia", value: insights.groupCount ?? 0 },
    ];
  }, [insights]);

  const trendingTopics = insights?.topPostTopics || [];

  const handleRefreshInterests = () => {
    if (typeof onRefreshSharedInterests === "function") {
      onRefreshSharedInterests();
    }
  };

  return (
    <aside className="right-rail">
      <section className="side-card">
        <header className="card-header">
          <h3>Thống kê mạng lưới</h3>
        </header>
        {insightsLoading ? (
          <div className="skeleton skeleton-insights" />
        ) : insightsError ? (
          <p className="empty-message">{insightsError}</p>
        ) : insights ? (
          <>
            <div className="stat-grid">
              {stats.map((stat) => (
                <StatTile key={stat.label} {...stat} />
              ))}
            </div>
            <div className="insight-section">
              <h4>Khu vực nổi bật</h4>
              <ChipList
                items={insights.topCities}
                placeholder="Chưa có dữ liệu thành phố."
              />
            </div>
            <div className="insight-section">
              <h4>Sở thích chung</h4>
              <ChipList
                items={insights.topInterests}
                placeholder="Chưa có thống kê sở thích."
              />
            </div>
            <div className="insight-section">
              <h4>Chủ đề được quan tâm</h4>
              <ChipList
                items={trendingTopics}
                placeholder="Chưa có dữ liệu chủ đề."
              />
            </div>
          </>
        ) : null}
      </section>

      <section className="side-card">
        <header className="card-header">
          <h3>Kết nối cùng sở thích</h3>
          {onRefreshSharedInterests && (
            <button
              type="button"
              className="link-button"
              onClick={handleRefreshInterests}
            >
              Làm mới
            </button>
          )}
        </header>

        {sharedInterestLoading ? (
          <div className="skeleton skeleton-requests" />
        ) : sharedInterestError ? (
          <div className="empty-state">
            <p>{sharedInterestError}</p>
            {onRefreshSharedInterests && (
              <button
                type="button"
                className="button primary"
                onClick={handleRefreshInterests}
              >
                Thử lại
              </button>
            )}
          </div>
        ) : sharedInterestSuggestions.length === 0 ? (
          <p className="empty-message">
            Chưa có gợi ý nào dựa trên sở thích. Hãy cập nhật hồ sơ của bạn để
            nhận thêm đề xuất.
          </p>
        ) : (
          <ul className="interest-suggestion-list">
            {sharedInterestSuggestions.map((suggestion) => (
              <SharedInterestItem
                key={suggestion.id}
                suggestion={suggestion}
                onSendRequest={onSendRequest}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="side-card">
        <header className="card-header">
          <h3>Lời mời kết bạn</h3>
        </header>

        {requestsLoading ? (
          <div className="skeleton skeleton-requests" />
        ) : requestsError ? (
          <p className="empty-message">{requestsError}</p>
        ) : (
          <>
            <div className="request-section">
              <h4>Đang chờ bạn</h4>
              {requests.incoming?.length ? (
                <ul className="request-list">
                  {requests.incoming.map((request) => (
                    <RequestItem
                      key={request.id}
                      request={request}
                      variant="incoming"
                      onAccept={onAccept}
                      onReject={onReject}
                    />
                  ))}
                </ul>
              ) : (
                <p className="empty-message">
                  Chưa có lời mời mới. Bạn hãy kết nối thêm nhé!
                </p>
              )}
            </div>

            <div className="request-section">
              <h4>Bạn đã gửi</h4>
              {requests.outgoing?.length ? (
                <ul className="request-list">
                  {requests.outgoing.map((request) => (
                    <RequestItem
                      key={request.id}
                      request={request}
                      variant="outgoing"
                      onCancel={onCancel}
                    />
                  ))}
                </ul>
              ) : (
                <p className="empty-message">
                  Bạn chưa gửi lời mời nào gần đây.
                </p>
              )}
            </div>
          </>
        )}
      </section>

      <section className="side-card">
        <header className="card-header">
          <h3>Gợi ý hội nhóm</h3>
        </header>

        {groupsLoading ? (
          <div className="skeleton skeleton-groups" />
        ) : groupsError ? (
          <p className="empty-message">{groupsError}</p>
        ) : groupSuggestions.length === 0 ? (
          <p className="empty-message">
            Tạm thời chưa có gợi ý phù hợp. Hãy kết nối thêm bạn bè để mở rộng
            cộng đồng.
          </p>
        ) : (
          <div className="group-suggestions">
            {groupSuggestions.map((item) => (
              <GroupSuggestionCard
                key={item.group.id || item.group.name}
                suggestion={item}
                joining={groupPending.has(item.group.id)}
                onJoin={onJoinGroup}
              />
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
