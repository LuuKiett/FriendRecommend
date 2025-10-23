import React, { useMemo } from "react";

const defaultAvatar =
  "https://api.dicebear.com/7.x/thumbs/svg?seed=feed-author";

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < minute) return "Vừa xong";
  if (diff < hour) {
    const minutes = Math.round(diff / minute);
    return `${minutes} phút trước`;
  }
  if (diff < day) {
    const hours = Math.round(diff / hour);
    return `${hours} giờ trước`;
  }
  if (diff < week) {
    const days = Math.round(diff / day);
    return `${days} ngày trước`;
  }
  return date.toLocaleDateString("vi-VN");
};

const normalizeContent = (text = "") =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const buildReasonLabel = (reasons = [], friendHighlights = []) => {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    if (friendHighlights.length > 0) {
      const [first, second] = friendHighlights;
      if (friendHighlights.length === 1) {
        return `${first.name} đã tương tác với bài viết này.`;
      }
      return `${first.name} và ${second?.name || "bạn bè"} đã tương tác với bài viết này.`;
    }
    return null;
  }

  const friendLike = reasons.find((reason) => reason.type === "friend_like");
  if (friendLike) {
    const friends = friendLike.friends || friendHighlights || [];
    if (friends.length === 0 && typeof friendLike.friendCount === "number") {
      return `${friendLike.friendCount} bạn bè đã thích bài viết này.`;
    }
    if (friends.length === 1) {
      return `${friends[0].name} đã thích bài viết này.`;
    }
    if (friends.length === 2) {
      return `${friends[0].name} và ${friends[1].name} đã thích bài viết này.`;
    }
    return `${friends[0].name}, ${friends[1].name} và ${
      (friendLike.friendCount || friends.length) - 2
    } người khác đã thích bài viết này.`;
  }

  if (reasons.some((reason) => reason.type === "friend_post")) {
    return "Bài viết mới từ bạn bè của bạn.";
  }

  return null;
};

const isImageUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
};

export default function PostCard({
  item,
  onToggleLike = () => {},
  likesInFlight,
  onSendRequest,
}) {
  const safeItem = item || {};
  const post = safeItem.post || {};
  const author = safeItem.author || {};
  const likeCount = safeItem.likeCount || 0;
  const liked = Boolean(safeItem.liked);
  const createdAt = formatRelativeTime(post?.createdAt);
  const paragraphs = useMemo(
    () => normalizeContent(post?.content || ""),
    [post?.content]
  );

  const reasonLabel = useMemo(
    () => buildReasonLabel(safeItem.reasons, safeItem.friendHighlights),
    [safeItem.reasons, safeItem.friendHighlights]
  );

  const topics = Array.isArray(post?.topics) ? post.topics : [];
  const highlights = safeItem.friendHighlights || [];
  const mutualFriends = safeItem.mutualFriends || [];
  const shouldSuggestConnection =
    typeof onSendRequest === "function" &&
    !(safeItem.reasons || []).some((reason) => reason.type === "friend_post");

  const pending = likesInFlight?.has(safeItem.id);
  const avatar = author?.avatar || defaultAvatar;

  if (!item) {
    return null;
  }

  return (
    <article className="post-card">
      <header className="post-card__header">
        <div className="post-card__author">
          <img src={avatar} alt={author?.name} />
          <div>
            <strong>{author?.name}</strong>
            {author?.headline && <p>{author.headline}</p>}
            <div className="post-card__meta">
              {createdAt && <span>{createdAt}</span>}
              {author?.city && <span>{author.city}</span>}
            </div>
          </div>
        </div>
        {shouldSuggestConnection && (
          <button
            type="button"
            className="button ghost"
            onClick={() => onSendRequest?.(author?.id || author?.email)}
          >
            Kết nối
          </button>
        )}
      </header>

      {reasonLabel && (
        <div className="post-card__reason">
          <span>{reasonLabel}</span>
        </div>
      )}

      <div className="post-card__content">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {post?.media &&
          (isImageUrl(post.media) ? (
            <img
              src={post.media}
              alt="Đính kèm bài viết"
              className="post-card__media"
            />
          ) : (
            <a
              href={post.media}
              target="_blank"
              rel="noopener noreferrer"
              className="post-card__link"
            >
              {post.media}
            </a>
          ))}
      </div>

      {topics.length > 0 && (
        <div className="post-card__topics">
          {topics.map((topic) => (
            <span key={topic} className="chip ghost">
              #{topic}
            </span>
          ))}
        </div>
      )}

      {(highlights.length > 0 || mutualFriends.length > 0) && (
        <div className="post-card__context">
          {highlights.length > 0 && (
            <div className="post-card__avatars">
              {highlights.slice(0, 4).map((friend) => (
                <img
                  key={friend.id || friend.email}
                  src={friend.avatar || defaultAvatar}
                  alt={friend.name}
                  title={friend.name}
                />
              ))}
              {highlights.length > 4 && (
                <span>+{highlights.length - 4}</span>
              )}
            </div>
          )}
          {mutualFriends.length > 0 && (
            <div className="post-card__mutual">
              <strong>
                {safeItem.mutualCount || mutualFriends.length}
              </strong>{" "}
              bạn chung với tác giả
            </div>
          )}
        </div>
      )}

      <footer className="post-card__footer">
        <button
          type="button"
          className={`button pill ${liked ? "primary" : "ghost"}`}
          disabled={pending}
          onClick={() => onToggleLike(safeItem.id, !liked)}
        >
          {liked ? "Đã thích" : "Thích"} • {likeCount}
        </button>
      </footer>
    </article>
  );
}
