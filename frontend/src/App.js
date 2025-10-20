import React from 'react';
import './App.css';

const suggestions = [
  {
    id: 'lan-nguyen',
    name: 'Lan Nguyen',
    avatar: 'https://i.pravatar.cc/164?img=47',
    mutualFriends: 12,
    mutualNames: ['Tuan Pham', 'Gia Minh', 'Ha Phuong'],
    headline: 'UI/UX Designer tai Figma Lovers',
    location: 'TP. Ho Chi Minh',
    sharedInterests: ['UIT Alumni', 'Thiet ke san pham'],
    lastActive: 'Hoat dong 5 phut truoc',
    note: 'Lan vua tham gia su kien "Product Design Summit" cuoi tuan.',
    highlightColor: '#e8f0ff',
  },
  {
    id: 'quang-tran',
    name: 'Quang Tran',
    avatar: 'https://i.pravatar.cc/164?img=40',
    mutualFriends: 7,
    mutualNames: ['Kim Dung', 'Huu Loc'],
    headline: 'Data Engineer tai VNG',
    location: 'Quan 7, TP. Ho Chi Minh',
    sharedInterests: ['Big Data', 'CLB AI & Robotics'],
    lastActive: 'Hoat dong 12 phut truoc',
    note: 'Quang cung theo hoc mon Big Data mua nay.',
    highlightColor: '#e9f6ef',
  },
  {
    id: 'anh-thu',
    name: 'Anh Thu',
    avatar: 'https://i.pravatar.cc/164?img=65',
    mutualFriends: 16,
    mutualNames: ['Dang Huu', 'Man Tran', 'Bao Chau'],
    headline: 'Product Manager tai Shopee',
    location: 'TP. Thu Duc',
    sharedInterests: ['Khoi nghiep', 'Women in Tech'],
    lastActive: 'Hoat dong 1 gio truoc',
    note: 'Ban be cua ban thuong tuong tac voi bai viet cua Thu.',
    highlightColor: '#fff4ec',
  },
  {
    id: 'bao-long',
    name: 'Bao Long',
    avatar: 'https://i.pravatar.cc/164?img=12',
    mutualFriends: 9,
    mutualNames: ['Thanh Tung', 'The Anh'],
    headline: 'Frontend Developer tai Axie Infinity',
    location: 'Quan 3, TP. Ho Chi Minh',
    sharedInterests: ['React Viet Nam', 'Sang tao noi dung'],
    lastActive: 'Hoat dong 3 phut truoc',
    note: 'Long va ban deu follow nhom ReactJS Vietnam.',
    highlightColor: '#f4f1ff',
  },
];

const quickFilters = [
  { id: 'mutual-5', label: 'Ban chung > 5', active: true },
  { id: 'same-city', label: 'Cung khu vuc', active: false },
  { id: 'recent-active', label: 'Dang hoat dong', active: false },
  { id: 'joined-this-week', label: 'Vua tham gia', active: false },
];

const pendingInvitations = [
  {
    id: 'thu-vo',
    name: 'Thu Vo',
    avatar: 'https://i.pravatar.cc/128?img=56',
    sentAt: '2 ngay truoc',
  },
  {
    id: 'minh-hieu',
    name: 'Minh Hieu',
    avatar: 'https://i.pravatar.cc/128?img=23',
    sentAt: '5 gio truoc',
  },
];

const insights = [
  'Ban va ho cung tham gia 2 nhom ve Big Data.',
  'Nhieu ban than cua ban da ket noi voi ho.',
  'Ho vua cap nhat thong tin nghe nghiep gan day.',
];

function SuggestionCard({ person }) {
  return (
    <article className="suggestion-card">
      <div
        className="card-cover"
        style={{ background: `linear-gradient(180deg, ${person.highlightColor}, #ffffff)` }}
      >
        <img
          className="card-avatar"
          src={person.avatar}
          alt={`Anh dai dien cua ${person.name}`}
        />
      </div>

      <div className="card-body">
        <h3>{person.name}</h3>
        <p className="headline">{person.headline}</p>

        <div className="mutual-friends">
          <div className="mutual-avatars">
            {person.mutualNames.slice(0, 3).map((name, index) => (
              <span key={name} className={`avatar avatar-${index + 1}`}>
                {name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
            ))}
          </div>
          <span>{person.mutualFriends} ban chung</span>
        </div>

        <div className="meta-row">
          <span className="meta-item">{person.location}</span>
          <span className="meta-divider" aria-hidden="true" />
          <span className="meta-item">{person.lastActive}</span>
        </div>

        <div className="tags">
          {person.sharedInterests.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>

        <p className="note">{person.note}</p>
      </div>

      <div className="card-actions">
        <button type="button" className="btn primary">
          Them ban be
        </button>
        <button type="button" className="btn secondary">
          An goi y
        </button>
      </div>
    </article>
  );
}

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">FR</span>
          <span className="brand-name">FriendConnect</span>
        </div>

        <div className="search-box">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.71.71l.27.28v.79l5 5L20.49 19l-5-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z"
              fill="currentColor"
            />
          </svg>
          <input placeholder="Tim kiem ban be, nhom hoac su kien" />
        </div>

        <nav className="top-actions">
          <button type="button" className="action-chip active">
            Goi y
          </button>
          <button type="button" className="action-chip">
            Loi moi ket ban
          </button>
          <button type="button" className="action-chip">
            Danh sach ban be
          </button>
        </nav>

        <div className="profile-pill">
          <span className="avatar">NT</span>
          <span className="profile-name">Nguoi dung</span>
        </div>
      </header>

      <div className="content-wrapper">
        <aside className="left-rail">
          <section className="module">
            <h2>Bo loc goi y</h2>
            <div className="chip-group">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`filter-chip ${filter.active ? 'is-active' : ''}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          <section className="module">
            <h3>Chu de ket noi</h3>
            <ul className="topic-list">
              <li>
                <span>Big Data & AI Lab</span>
                <span className="badge">128</span>
              </li>
              <li>
                <span>UIT Alumni 2022</span>
                <span className="badge">86</span>
              </li>
              <li>
                <span>Mentor - Mentee</span>
                <span className="badge">42</span>
              </li>
              <li>
                <span>Khoi nghiep cong nghe</span>
                <span className="badge">31</span>
              </li>
            </ul>
          </section>
        </aside>

        <main className="main-column">
          <section className="suggestions-panel">
            <div className="panel-header">
              <div>
                <h1>Goi y ket ban</h1>
                <p className="panel-subtitle">
                  Thuat toan uu tien cac ket noi lien quan den hoc tap, cong viec va ban chung.
                </p>
              </div>
              <button type="button" className="btn subtle">
                Tuy chinh goi y
              </button>
            </div>

            <div className="card-grid">
              {suggestions.map((person) => (
                <SuggestionCard key={person.id} person={person} />
              ))}
            </div>
          </section>
        </main>

        <aside className="right-rail">
          <section className="module">
            <h3>Vi sao ban thay goi y nay?</h3>
            <ul className="insight-list">
              {insights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="module">
            <h3>Loi moi da gui</h3>
            <ul className="pending-list">
              {pendingInvitations.map((invite) => (
                <li key={invite.id} className="pending-item">
                  <span className="avatar small">
                    {invite.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <div>
                    <p className="name">{invite.name}</p>
                    <p className="meta">{invite.sentAt}</p>
                  </div>
                  <button type="button" className="btn tertiary">
                    Huy
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default App;
