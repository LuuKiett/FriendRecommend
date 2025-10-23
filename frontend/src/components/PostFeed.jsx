import React from "react";
import PostComposer from "./PostComposer";
import PostCard from "./PostCard";

export default function PostFeed({
  profile,
  feed = [],
  loading,
  error,
  onRefresh,
  onCreatePost,
  creating,
  onToggleLike,
  likesInFlight,
  trendingTopics,
  onSendRequest,
}) {
  return (
    <section className="post-feed">
      <PostComposer
        profile={profile}
        onSubmit={onCreatePost}
        creating={creating}
        suggestedTopics={trendingTopics}
      />

      <div className="post-feed__content">
        <header className="post-feed__header">
          <h2>Bản tin kết nối</h2>
          <button type="button" className="icon-button" onClick={onRefresh}>
            ↻
          </button>
        </header>

        {error ? (
          <div className="empty-state">
            <p>{error}</p>
            <button
              type="button"
              className="button primary"
              onClick={onRefresh}
            >
              Thử lại
            </button>
          </div>
        ) : loading && feed.length === 0 ? (
          <div className="post-feed__skeleton">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="post-card skeleton" />
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="empty-state">
            <h3>Bản tin của bạn đang trống</h3>
            <p>
              Hãy kết nối thêm bạn bè hoặc theo dõi chủ đề để nhận được nhiều nội
              dung phù hợp hơn.
            </p>
            <button
              type="button"
              className="button ghost"
              onClick={onRefresh}
            >
              Làm mới
            </button>
          </div>
        ) : (
          feed.map((item) => (
            <PostCard
              key={item.id}
              item={item}
              onToggleLike={onToggleLike}
              likesInFlight={likesInFlight}
              onSendRequest={onSendRequest}
            />
          ))
        )}
      </div>
    </section>
  );
}
