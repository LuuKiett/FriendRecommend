import React from "react";

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
}) {
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
              <StatTile label="Bạn bè" value={insights.friendCount} />
              <StatTile label="Lời mời đến" value={insights.incomingCount} />
              <StatTile label="Đã gửi" value={insights.outgoingCount} />
              <StatTile label="Gợi ý" value={insights.suggestionCount} />
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
          </>
        ) : null}
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
    </aside>
  );
}
