import React, { useState } from "react";

const defaultCover =
  "https://api.dicebear.com/7.x/shapes/svg?seed=friend-groups";

export default function GroupSearchResultCard({ result, onJoin }) {
  const [joining, setJoining] = useState(false);

  if (!result) return null;

  const {
    id,
    name,
    description,
    cover,
    memberCount = 0,
    friendMemberCount = 0,
    friendMembers = [],
    sharedTopics = [],
    isMember = false,
  } = result;

  const previewFriends = Array.isArray(friendMembers)
    ? friendMembers.slice(0, 4)
    : [];
  const displayTopics = Array.isArray(sharedTopics)
    ? sharedTopics.slice(0, 4)
    : [];

  const handleJoin = async () => {
    if (!onJoin || joining || isMember) return;
    setJoining(true);
    try {
      await onJoin(id);
    } finally {
      setJoining(false);
    }
  };

  return (
    <article className="group-card search-card" onClick={() => window.location.assign(`/groups/${id}`)}>
      <div className="group-card__cover">
        <img src={cover || defaultCover} alt={name} />
      </div>
      <div className="group-card__body">
        <header>
          <h4>{name}</h4>
          {description && <p>{description}</p>}
        </header>
        <div className="group-card__meta">
          <span>{Number(memberCount)} thành viên</span>
          {friendMemberCount > 0 ? (
            <span>{friendMemberCount} bạn đã tham gia</span>
          ) : displayTopics.length > 0 ? (
            <span>Chủ đề liên quan</span>
          ) : (
            <span>Chưa có bạn chung</span>
          )}
        </div>

        {friendMemberCount > 0 && previewFriends.length > 0 && (
          <div className="group-card__avatars">
            {previewFriends.map((friend) => (
              <img
                key={friend.id || friend.email}
                src={friend.avatar || defaultCover}
                alt={friend.name}
                title={friend.name}
              />
            ))}
            {friendMemberCount > previewFriends.length && (
              <span>+{friendMemberCount - previewFriends.length}</span>
            )}
          </div>
        )}

        {friendMemberCount === 0 && displayTopics.length > 0 && (
          <div className="group-card__topics">
            {displayTopics.map((topic) => {
              const label = topic?.value || topic?.label || topic;
              return (
                <span key={label} className="chip ghost">
                  #{label}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <footer className="group-card__footer" onClick={(e) => e.stopPropagation()}>
        {isMember ? (
          <span className="status-pill status-friend">Đã tham gia</span>
        ) : (
          <button
            type="button"
            className="button primary"
            disabled={joining}
            onClick={handleJoin}
          >
            {joining ? "Đang xử lý..." : "Tham gia nhóm"}
          </button>
        )}
      </footer>
    </article>
  );
}


