import React from "react";

const defaultCover =
  "https://api.dicebear.com/7.x/shapes/svg?seed=friend-groups";

export default function GroupSuggestionCard({
  suggestion,
  onJoin,
  joining = false,
}) {
  if (!suggestion?.group) return null;
  const { group, friendMembers = [], sharedTopics = [] } = suggestion;
  const cover = group.cover || defaultCover;
  const isFriendReason = suggestion.reason === "friends";

  return (
    <article className="group-card">
      <div className="group-card__cover">
        <img src={cover} alt={group.name} />
      </div>
      <div className="group-card__body">
        <header>
          <h4>{group.name}</h4>
          {group.description && <p>{group.description}</p>}
        </header>
        <div className="group-card__meta">
          <span>{suggestion.memberCount} thành viên</span>
          {isFriendReason ? (
            <span>{suggestion.friendCount} bạn bè đã tham gia</span>
          ) : (
            <span>{suggestion.friendCount} sở thích trùng khớp</span>
          )}
        </div>

        {isFriendReason && friendMembers.length > 0 && (
          <div className="group-card__avatars">
            {friendMembers.slice(0, 4).map((friend) => (
              <img
                key={friend.id || friend.email}
                src={friend.avatar || defaultCover}
                alt={friend.name}
                title={friend.name}
              />
            ))}
            {friendMembers.length > 4 && (
              <span>+{friendMembers.length - 4}</span>
            )}
          </div>
        )}

        {!isFriendReason && sharedTopics.length > 0 && (
          <div className="group-card__topics">
            {sharedTopics.slice(0, 4).map((topic) => {
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
      <footer className="group-card__footer">
        <button
          type="button"
          className="button primary"
          disabled={joining}
          onClick={() => onJoin?.(group.id)}
        >
          {joining ? "Đang xử lý..." : "Tham gia nhóm"}
        </button>
      </footer>
    </article>
  );
}


