import React, { useMemo, useState } from "react";

const visibilityOptions = [
  { value: "friends", label: "Bạn bè" },
  { value: "public", label: "Công khai" },
  { value: "private", label: "Chỉ mình tôi" },
];

const defaultAvatar =
  "https://api.dicebear.com/7.x/thumbs/svg?seed=post-composer";

export default function PostComposer({
  profile,
  onSubmit,
  creating = false,
  suggestedTopics = [],
}) {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState("");
  const [topics, setTopics] = useState([]);
  const [visibility, setVisibility] = useState("friends");
  const [error, setError] = useState(null);

  const avatar = profile?.avatar || defaultAvatar;

  const remainingChars = useMemo(() => {
    const limit = 600;
    return limit - content.length;
  }, [content]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSubmit) return;

    const payload = {
      content: content.trim(),
      media: media.trim() || undefined,
      topics,
      visibility,
    };

    const result = await onSubmit(payload);
    if (result?.success) {
      setContent("");
      setMedia("");
      setTopics([]);
      setError(null);
    } else if (result?.message) {
      setError(result.message);
    }
  };

  const handleAddTopic = (topic) => {
    const normalized = topic.trim();
    if (!normalized) return;
    setTopics((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized]
    );
  };

  const handleRemoveTopic = (topic) => {
    setTopics((prev) => prev.filter((item) => item !== topic));
  };

  const trending = useMemo(() => {
    if (!Array.isArray(suggestedTopics)) return [];
    return suggestedTopics
      .map((item) =>
        typeof item === "string" ? item : item?.value || item?.label
      )
      .filter(Boolean)
      .slice(0, 6);
  }, [suggestedTopics]);

  return (
    <section className="post-composer-card">
      <form onSubmit={handleSubmit}>
        <header className="composer-header">
          <img src={avatar} alt={profile?.name} />
          <div>
            <h3>Bạn đang nghĩ gì?</h3>
            <p>
              Viết vài dòng để bạn bè hiểu thêm về bạn, hoặc chia sẻ nội dung
              hữu ích mà bạn vừa khám phá.
            </p>
          </div>
        </header>

        <div className="composer-body">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, 600))}
            placeholder="Chia sẻ suy nghĩ, câu chuyện hoặc lời chào tới mạng lưới của bạn..."
            rows={4}
          />
          <div className="composer-meta">
            <span>{remainingChars} ký tự</span>
            <label>
              Đường dẫn hình ảnh (tuỳ chọn)
              <input
                type="url"
                value={media}
                onChange={(event) => setMedia(event.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>

          <div className="composer-topics">
            <label htmlFor="topicInput">Chủ đề nổi bật</label>
            <div className="topic-chips">
              {topics.map((topic) => (
                <button
                  type="button"
                  key={topic}
                  className="chip selected"
                  onClick={() => handleRemoveTopic(topic)}
                >
                  #{topic} ×
                </button>
              ))}
              {trending
                .filter((topic) => !topics.includes(topic))
                .map((topic) => (
                  <button
                    type="button"
                    key={topic}
                    className="chip ghost"
                    onClick={() => handleAddTopic(topic)}
                  >
                    #{topic}
                  </button>
                ))}
            </div>
            <small>
              Gõ #hashtag trong nội dung hoặc chọn nhanh từ gợi ý để hệ thống
              hiểu rõ hơn sở thích của bạn.
            </small>
          </div>

          <div className="composer-footer">
            <label>
              Quyền hiển thị
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
              >
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="button primary"
              disabled={creating || !content.trim()}
            >
              {creating ? "Đang đăng..." : "Đăng bài"}
            </button>
          </div>

          {error && <p className="composer-error">{error}</p>}
        </div>
      </form>
    </section>
  );
}
