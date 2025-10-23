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

  if (diff < minute) return "Vua xong";
  if (diff < hour) {
    const minutes = Math.round(diff / minute);
    return `${minutes} phut truoc`;
  }
  if (diff < day) {
    const hours = Math.round(diff / hour);
    return `${hours} gio truoc`;
  }
  const days = Math.round(diff / day);
  return `${days} ngay truoc`;
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
              Chap nhan
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => onReject(request.id)}
            >
              Bo qua
            </button>
          </>
        ) : (
          <button
            type="button"
            className="button ghost"
            onClick={() => onCancel(request.id)}
          >
            Huy loi moi
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
          <h3>Thong ke mang luoi</h3>
        </header>
        {insightsLoading ? (
          <div className="skeleton skeleton-insights" />
        ) : insightsError ? (
          <p className="empty-message">{insightsError}</p>
        ) : insights ? (
          <>
            <div className="stat-grid">
              <StatTile label="Ban be" value={insights.friendCount} />
              <StatTile label="Loi moi den" value={insights.incomingCount} />
              <StatTile label="Da gui" value={insights.outgoingCount} />
              <StatTile label="Goi y" value={insights.suggestionCount} />
            </div>
            <div className="insight-section">
              <h4>Khu vuc noi bat</h4>
              <ChipList
                items={insights.topCities}
                placeholder="Chua co du lieu thanh pho."
              />
            </div>
            <div className="insight-section">
              <h4>So thich chung</h4>
              <ChipList
                items={insights.topInterests}
                placeholder="Chua co thong ke so thich."
              />
            </div>
          </>
        ) : null}
      </section>

      <section className="side-card">
        <header className="card-header">
          <h3>Loi moi ket ban</h3>
        </header>

        {requestsLoading ? (
          <div className="skeleton skeleton-requests" />
        ) : requestsError ? (
          <p className="empty-message">{requestsError}</p>
        ) : (
          <>
            <div className="request-section">
              <h4>Dang cho ban</h4>
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
                  Chua co loi moi moi. Ban hay ket noi them nhe!
                </p>
              )}
            </div>

            <div className="request-section">
              <h4>Ban da gui</h4>
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
                  Ban chua gui loi moi nao gan day.
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </aside>
  );
}
