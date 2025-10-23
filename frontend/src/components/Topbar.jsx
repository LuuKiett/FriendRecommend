import React, { useEffect, useRef, useState } from "react";

const defaultAvatar =
  "https://api.dicebear.com/7.x/thumbs/svg?seed=friend-connect";

const RefreshIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
    <path
      d="M10 3a7 7 0 014.95 2.05l.7-.7a1 1 0 011.4 1.42l-2.5 2.5a1 1 0 01-1.42 0l-2.5-2.5a1 1 0 011.42-1.42l.52.52A5 5 0 105 10a1 1 0 11-2 0A7 7 0 0110 3z"
      fill="currentColor"
    />
  </svg>
);

const FriendsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill="currentColor"
      d="M16 11a4 4 0 10-3.999-4 4 4 0 003.999 4zm-8 0a4 4 0 10-3.999-4A4 4 0 008 11zm0 2c-2.67 0-8 1.34-8 4v2h9.17a6.62 6.62 0 01-.17-1.5 6.46 6.46 0 012.37-5.03A11 11 0 008 13zm8 0a5 5 0 00-5 5 5 5 0 1010 0 5 5 0 00-5-5z"
    />
  </svg>
);

const noop = () => {};

export default function Topbar({
  user,
  loadingUser,
  pendingCount = 0,
  onRefresh = noop,
  onLogout = noop,
  requests,
  requestsLoading = false,
  requestsError,
  friends,
  friendsLoading = false,
  friendsError,
  onAcceptRequest = noop,
  onRejectRequest = noop,
  onCancelRequest = noop,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return undefined;
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const displayName = loadingUser
    ? "Dang tai..."
    : user?.name || "Nguoi dung";
  const avatar = user?.avatar || defaultAvatar;
  const headline = user?.headline || "San sang ket noi";

  const incoming = requests?.incoming || [];
  const outgoing = requests?.outgoing || [];
  const friendList = friends || [];

  const wrapAction = (action) => (id) => {
    setShowMenu(false);
    return action(id);
  };

  const acceptAndClose = wrapAction(onAcceptRequest);
  const rejectAndClose = wrapAction(onRejectRequest);
  const cancelAndClose = wrapAction(onCancelRequest);

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark">FC</div>
        <div className="brand-copy">
          <h1>FriendConnect</h1>
          <span>Goi y ban be thong minh</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button"
          onClick={onRefresh}
          title="Lam moi goi y"
        >
          <RefreshIcon />
        </button>

        <div className="friend-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="icon-button friend-toggle"
            onClick={() => setShowMenu((open) => !open)}
            title="Ban be va loi moi"
          >
            <FriendsIcon />
            {pendingCount > 0 && (
              <span className="badge">{pendingCount}</span>
            )}
          </button>

          {showMenu && (
            <div className="friends-menu">
              <section>
                <h4>Loi moi dang cho</h4>
                {requestsLoading ? (
                  <p className="empty-message">Dang tai loi moi...</p>
                ) : requestsError ? (
                  <p className="empty-message">{requestsError}</p>
                ) : incoming.length === 0 ? (
                  <p className="empty-message">
                    Chua co loi moi moi. Hay gioi thieu ban than de ket noi.
                  </p>
                ) : (
                  <ul>
                    {incoming.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.user.name}</strong>
                          {item.user.headline && (
                            <span>{item.user.headline}</span>
                          )}
                        </div>
                        <div className="friends-menu-actions">
                          <button
                            type="button"
                            className="button primary"
                            onClick={() => acceptAndClose(item.id)}
                          >
                            Chap nhan
                          </button>
                          <button
                            type="button"
                            className="button ghost"
                            onClick={() => rejectAndClose(item.id)}
                          >
                            Bo qua
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4>Da gui</h4>
                {requestsLoading ? (
                  <p className="empty-message">Dang tai...</p>
                ) : outgoing.length === 0 ? (
                  <p className="empty-message">
                    Ban chua gui loi moi nao gan day.
                  </p>
                ) : (
                  <ul>
                    {outgoing.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.user.name}</strong>
                          <span>Dang cho phan hoi</span>
                        </div>
                        <div className="friends-menu-actions">
                          <button
                            type="button"
                            className="button ghost"
                            onClick={() => cancelAndClose(item.id)}
                          >
                            Huy loi moi
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4>Ban be</h4>
                {friendsLoading ? (
                  <p className="empty-message">Dang tai danh sach ban be...</p>
                ) : friendsError ? (
                  <p className="empty-message">{friendsError}</p>
                ) : friendList.length === 0 ? (
                  <p className="empty-message">
                    Ket noi voi mot vai nguoi de mo rong mang luoi.
                  </p>
                ) : (
                  <ul>
                    {friendList.slice(0, 6).map((friend) => (
                      <li key={friend.id}>
                        <div>
                          <strong>{friend.name}</strong>
                          {friend.city && <span>{friend.city}</span>}
                        </div>
                      </li>
                    ))}
                    {friendList.length > 6 && (
                      <li className="friends-menu-note">
                        +{friendList.length - 6} ban be khac
                      </li>
                    )}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>

        <div className="user-chip">
          <img src={avatar} alt={displayName} />
          <div className="user-chip-text">
            <strong>{displayName}</strong>
            <span>{headline}</span>
          </div>
        </div>

        <button type="button" className="button ghost" onClick={onLogout}>
          Dang xuat
        </button>
      </div>
    </header>
  );
}
