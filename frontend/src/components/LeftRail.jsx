import React, { useState } from "react";

const mutualOptions = [
  { value: 0, label: "Tất cả" },
  { value: 1, label: "Từ 1 bạn chung" },
  { value: 3, label: "Từ 3 bạn chung" },
  { value: 5, label: "Từ 5 bạn chung" },
];

export default function LeftRail({
  profile,
  loadingProfile,
  error,
  filters,
  onFilterChange,
  onResetFilters,
  cities = [],
  interests = [],
  searchTerm,
  onSearchChange,
  searchActive = false,
  searchLoading = false,
  searchCount = 0,
  insights,
  groups = [],
  onCreateGroup,
  creatingGroup = false,
  onLeaveGroup,
  pendingGroups,
}) {
  const handleSelect = (field) => (event) => {
    const { value } = event.target;
    onFilterChange({ [field]: field === "mutualMin" ? Number(value) : value });
  };

  const handleToggleInterestMatches = (event) => {
    onFilterChange({ includeInterestMatches: event.target.checked });
  };

  const trimmedSearch = (searchTerm || "").trim();
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const handleSubmitGroup = async (event) => {
    event.preventDefault();
    if (!onCreateGroup) return;
    const result = await onCreateGroup({
      name: groupName,
      description: groupDesc,
    });
    if (result?.success) {
      setGroupName("");
      setGroupDesc("");
      setShowGroupForm(false);
    }
  };

  return (
    <aside className="left-rail">
      <section className="side-card profile-card">
        {loadingProfile ? (
          <div className="skeleton skeleton-profile" />
        ) : profile ? (
          <>
            <img
              src={
                profile.avatar ||
                "https://api.dicebear.com/7.x/thumbs/svg?seed=friend-profile"
              }
              alt={profile.name}
              className="profile-avatar"
            />
            <h2>{profile.name}</h2>
            <p className="profile-headline">
              {profile.headline || "Cùng xây dựng mạng lưới kết nối mới"}
            </p>
            <ul className="profile-meta">
              {profile.city && (
                <li>
                  <span className="dot" /> {profile.city}
                </li>
              )}
              {profile.workplace && (
                <li>
                  <span className="dot" /> {profile.workplace}
                </li>
              )}
            </ul>
            {insights?.friendCount !== undefined && (
              <div className="profile-stats">
                <strong>{insights.friendCount}</strong>
                <span>Bạn bè hiện tại</span>
              </div>
            )}
          </>
        ) : (
          <p className="empty-message">{error}</p>
        )}
      </section>

      <section className="side-card filter-card">
        <header className="card-header">
          <h3>Bộ lọc gợi ý</h3>
          <button type="button" className="link-button" onClick={onResetFilters}>
            Xóa bộ lọc
          </button>
        </header>

        <div className="filter-group">
          <label htmlFor="search">Tìm kiếm nhanh</label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Tên, thành phố hoặc sở thích..."
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <small className="help-text">
            {trimmedSearch.length === 0
              ? "Nhập từ khóa để tìm bạn bè theo tên, thành phố hoặc sở thích."
              : trimmedSearch.length < 2
              ? "Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm."
              : searchLoading
              ? "Đang tìm kiếm..."
              : searchActive
              ? `Đang hiển thị ${searchCount} kết quả tìm kiếm.`
              : "Nhập để tiếp tục tìm kiếm."}
          </small>
        </div>

        <div className="filter-group">
          <label htmlFor="mutualMin">Bạn chung</label>
          <select
            id="mutualMin"
            value={filters.mutualMin}
            onChange={handleSelect("mutualMin")}
          >
            {mutualOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="city">Thành phố</label>
          <select
            id="city"
            value={filters.city}
            onChange={handleSelect("city")}
          >
            <option value="all">Tất cả</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="interest">Sở thích</label>
          <select
            id="interest"
            value={filters.interest}
            onChange={handleSelect("interest")}
          >
            <option value="all">Tất cả</option>
            {interests.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-toggle">
          <input
            id="interestToggle"
            type="checkbox"
            checked={filters.includeInterestMatches}
            onChange={handleToggleInterestMatches}
          />
          <label htmlFor="interestToggle">
            Chỉ hiển thị sở thích trùng khớp
          </label>
        </div>
      </section>

      <section className="side-card group-membership-card">
        <header className="card-header">
          <h3>Hội nhóm của bạn</h3>
          <button
            type="button"
            className="link-button"
            onClick={() => setShowGroupForm((value) => !value)}
          >
            {showGroupForm ? "Đóng" : "Tạo nhóm"}
          </button>
        </header>

        {showGroupForm && (
          <form className="group-form" onSubmit={handleSubmitGroup}>
            <label>
              Tên nhóm
              <input
                type="text"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Cộng đồng nghiên cứu dữ liệu..."
                minLength={3}
                required
              />
            </label>
            <label>
              Mô tả ngắn
              <textarea
                rows={2}
                value={groupDesc}
                onChange={(event) => setGroupDesc(event.target.value)}
                placeholder="Giới thiệu ngắn gọn mục tiêu của nhóm"
              />
            </label>
            <button
              type="submit"
              className="button primary"
              disabled={creatingGroup}
            >
              {creatingGroup ? "Đang tạo..." : "Tạo nhóm mới"}
            </button>
          </form>
        )}

        {groups.length === 0 ? (
          <p className="empty-message">
            Tham gia hoặc tạo nhóm để cập nhật tin tức từ cộng đồng của bạn.
          </p>
        ) : (
          <ul className="group-list">
            {groups.map((item) => {
              const groupId = item.group?.id;
              const isPending = pendingGroups?.has(groupId);
              return (
                <li key={groupId} className="group-list__item">
                  <div>
                    <strong>{item.group?.name}</strong>
                    <p>
                      {item.memberCount} thành viên •{" "}
                      {item.membership?.role === "owner"
                        ? "Quản trị viên"
                        : "Thành viên"}
                    </p>
                  </div>
                  {onLeaveGroup && (
                    <button
                      type="button"
                      className="button ghost"
                      disabled={isPending}
                      title="Rời nhóm"
                      onClick={() => onLeaveGroup(groupId)}
                    >
                      {isPending ? "Đang rời..." : "Rời nhóm"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}

