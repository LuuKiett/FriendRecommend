import React, { useEffect, useRef, useState } from "react";

const defaultAvatar =
  "https://api.dicebear.com/7.x/thumbs/svg?seed=friend-connect";
const defaultGroupCover =
  "https://api.dicebear.com/7.x/shapes/svg?seed=friend-groups";

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

const SearchIcon = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
    <path
      fill="currentColor"
      d="M8.5 2a6.5 6.5 0 014.88 10.63l3 3a1 1 0 11-1.42 1.42l-3-3A6.5 6.5 0 118.5 2zm0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"
    />
  </svg>
);

const STATUS_METADATA = {
  friend: {
    label: "Bạn bè",
    description: "Đã là bạn bè",
    className: "status-friend",
  },
  incoming: {
    label: "Chờ bạn",
    description: "Đang chờ bạn phản hồi",
    className: "status-incoming",
  },
  outgoing: {
    label: "Đã gửi",
    description: "Đã gửi lời mời",
    className: "status-outgoing",
  },
  none: {
    label: "Chưa kết nối",
    description: "Chưa kết nối",
    className: "status-none",
  },
};

const noop = () => {};

export default function Topbar({
  user,
  loadingUser,
  pendingCount = 0,
  onRefresh = noop,
  onLogout = noop,
  searchTerm = "",
  onSearchChange = noop,
  searchUsers = [],
  searchGroups = [],
  searchActive = false,
  searchLoading = false,
  searchError,
  onSendRequest = noop,
  onJoinGroup = noop,
  requests = {},
  requestsLoading = false,
  requestsError,
  friends = [],
  friendsLoading = false,
  friendsError,
  onAcceptRequest = noop,
  onRejectRequest = noop,
  onCancelRequest = noop,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen]);

  const displayName = loadingUser ? "Đang tải..." : user?.name || "Người dùng";
  const avatar = user?.avatar || defaultAvatar;
  const headline = user?.headline || "Sẵn sàng kết nối";

  const incoming = requests?.incoming || [];
  const outgoing = requests?.outgoing || [];
  const friendList = Array.isArray(friends) ? friends : [];

  const wrapMenuAction = (action) => async (id) => {
    setShowMenu(false);
    return action(id);
  };

  const acceptAndClose = wrapMenuAction(onAcceptRequest);
  const rejectAndClose = wrapMenuAction(onRejectRequest);
  const cancelAndClose = wrapMenuAction(onCancelRequest);

  const trimmedSearch = (searchTerm || "").trim();
  const hasQuery = trimmedSearch.length >= 2;
  const previewUsers = Array.isArray(searchUsers)
    ? searchUsers.slice(0, 5)
    : [];
  const previewGroups = Array.isArray(searchGroups)
    ? searchGroups.slice(0, 3)
    : [];
  const totalResultsCount =
    (Array.isArray(searchUsers) ? searchUsers.length : 0) +
    (Array.isArray(searchGroups) ? searchGroups.length : 0);
  const hasPreviewResults =
    previewUsers.length > 0 || previewGroups.length > 0;

  const handleSearchInput = (e) => {
    if (!searchOpen) setSearchOpen(true);
    onSearchChange(e.target.value);
  };

  const handleSearchFocus = () => {
    if (!searchOpen) setSearchOpen(true);
  };

  const handleClearSearch = () => {
    onSearchChange("");
    setSearchOpen(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      e.currentTarget.blur();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleSeeAllResults();
    }
  };

  const handleSeeAllResults = () => {
    setSearchOpen(false);
    const panel = document.getElementById("search-results-panel");
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark">FC</div>
        <div className="brand-copy">
          <h1>FriendConnect</h1>
          <span>Gợi ý bạn bè thông minh</span>
        </div>
      </div>

      <div className="topbar-search" ref={searchRef}>
        <div className="topbar-search__icon">
          <SearchIcon />
        </div>
        <input
          type="search"
          value={searchTerm}
          placeholder="Tìm kiếm bạn bè và hội nhóm"
          onChange={handleSearchInput}
          onFocus={handleSearchFocus}
          onKeyDown={handleSearchKeyDown}
          aria-label="Tìm kiếm bạn bè"
        />
        {trimmedSearch && (
          <button
            type="button"
            className="topbar-search__clear"
            onClick={handleClearSearch}
            aria-label="Xóa tìm kiếm"
          >
            &times;
          </button>
        )}
        {searchOpen && hasQuery && (
          <div className="topbar-search__dropdown">
            {searchLoading ? (
              <div className="empty-message">Đang tìm kiếm...</div>
            ) : totalResultsCount === 0 ? (
              <div className="empty-message">Không có kết quả phù hợp</div>
            ) : (
              <>
                {previewUsers.length > 0 && (
                  <div className="dropdown-section">
                    <h4>Người dùng</h4>
                    <ul>
                      {previewUsers.map((u) => (
                        <li key={u.id} className="dropdown-item">
                          <img src={u.avatar || defaultAvatar} alt={u.name} />
                          <div>
                            <strong>{u.name}</strong>
                            {u.headline && <span>{u.headline}</span>}
                          </div>
                          <button
                            type="button"
                            className="button primary"
                            onClick={() => onSendRequest(u.id)}
                          >
                            Kết bạn
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewGroups.length > 0 && (
                  <div className="dropdown-section">
                    <h4>Hội nhóm</h4>
                    <ul>
                      {previewGroups.map((g) => (
                        <li key={g.id} className="dropdown-item"
                            onClick={() => window.location.assign(`/groups/${g.id}`)}>
                          <img src={g.cover || defaultGroupCover} alt={g.name} />
                          <div>
                            <strong>{g.name}</strong>
                            {g.description && <span>{g.description}</span>}
                          </div>
                          <button
                            type="button"
                            className="button ghost"
                            onClick={(e) => { e.stopPropagation(); onJoinGroup(g.id); }}
                          >
                            Tham gia
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="dropdown-footer">
                  <button type="button" className="link-button" onClick={handleSeeAllResults}>
                    Xem tất cả kết quả
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button"
          onClick={onRefresh}
          title="Làm mới gợi ý"
        >
          <RefreshIcon />
        </button>

        <div className="friend-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="icon-button friend-toggle"
            onClick={() => setShowMenu((o) => !o)}
            title="Bạn bè và lời mời"
          >
            <FriendsIcon />
            {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
          </button>

          {showMenu && (
            <div className="friends-menu">
              <section>
                <h4>Lời mời đang chờ</h4>
                {requestsLoading ? (
                  <p className="empty-message">Đang tải lời mời...</p>
                ) : incoming.length === 0 ? (
                  <p className="empty-message">
                    Chưa có lời mời mới. Hãy giới thiệu bản thân để kết nối.
                  </p>
                ) : (
                  <ul>
                    {incoming.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.user.name}</strong>
                          {item.user.headline && <span>{item.user.headline}</span>}
                        </div>
                        <div className="friends-menu-actions">
                          <button
                            type="button"
                            className="button primary"
                            onClick={() => acceptAndClose(item.id)}
                          >
                            Chấp nhận
                          </button>
                          <button
                            type="button"
                            className="button ghost"
                            onClick={() => rejectAndClose(item.id)}
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4>Đã gửi</h4>
                {outgoing.length === 0 ? (
                  <p className="empty-message">
                    Bạn chưa gửi lời mời nào gần đây.
                  </p>
                ) : (
                  <ul>
                    {outgoing.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.user.name}</strong>
                          <span>Đang chờ phản hồi</span>
                        </div>
                        <div className="friends-menu-actions">
                          <button
                            type="button"
                            className="button ghost"
                            onClick={() => cancelAndClose(item.id)}
                          >
                            Hủy lời mời
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4>Bạn bè</h4>
                {friendsLoading ? (
                  <p className="empty-message">Đang tải danh sách bạn bè...</p>
                ) : friendList.length === 0 ? (
                  <p className="empty-message">
                    Kết nối với vài người để làm mới mạng lưới.
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
                        +{friendList.length - 6} bạn bè khác
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
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
