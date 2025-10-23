import React from "react";

const mutualOptions = [
  { value: 0, label: "Tat ca" },
  { value: 1, label: "Tu 1 ban chung" },
  { value: 3, label: "Tu 3 ban chung" },
  { value: 5, label: "Tu 5 ban chung" },
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
}) {
  const handleSelect = (field) => (event) => {
    const { value } = event.target;
    onFilterChange({ [field]: field === "mutualMin" ? Number(value) : value });
  };

  const handleToggleInterestMatches = (event) => {
    onFilterChange({ includeInterestMatches: event.target.checked });
  };

  const trimmedSearch = (searchTerm || "").trim();

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
              {profile.headline || "Cung xay dung mang luoi ket noi moi"}
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
                <span>Ban be hien tai</span>
              </div>
            )}
          </>
        ) : (
          <p className="empty-message">{error}</p>
        )}
      </section>

      <section className="side-card filter-card">
        <header className="card-header">
          <h3>Bo loc goi y</h3>
          <button type="button" className="link-button" onClick={onResetFilters}>
            Xoa bo loc
          </button>
        </header>

        <div className="filter-group">
          <label htmlFor="search">Tim kiem nhanh</label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Ten, thanh pho hoac so thich..."
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <small className="help-text">
            {trimmedSearch.length === 0
              ? "Nhap tu khoa de tim ban be theo ten, thanh pho hoac so thich."
              : trimmedSearch.length < 2
              ? "Nhap it nhat 2 ky tu de bat dau tim kiem."
              : searchLoading
              ? "Dang tim kiem..."
              : searchActive
              ? `Dang hien thi ${searchCount} ket qua tim kiem.`
              : "Nhap de tiep tuc tim kiem."}
          </small>
        </div>

        <div className="filter-group">
          <label htmlFor="mutualMin">Ban chung</label>
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
          <label htmlFor="city">Thanh pho</label>
          <select
            id="city"
            value={filters.city}
            onChange={handleSelect("city")}
          >
            <option value="all">Tat ca</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="interest">So thich</label>
          <select
            id="interest"
            value={filters.interest}
            onChange={handleSelect("interest")}
          >
            <option value="all">Tat ca</option>
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
            Chi hien thi so thich trung khop
          </label>
        </div>
      </section>
    </aside>
  );
}
