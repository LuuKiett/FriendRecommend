import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";

const normalizeItem = (raw) => {
  if (!raw) return null;
  const post = raw.post || {};
  return {
    id: post.id,
    post,
    author: raw.author || null,
    likeCount: Number(raw.likeCount ?? 0),
    liked: Boolean(raw.liked),
    friendHighlights: raw.friendHighlights || [],
    reasons: raw.reasons || [],
    mutualFriends: raw.mutualFriends || [],
    mutualCount: Number(raw.mutualCount ?? 0),
  };
};

export default function usePostFeed(options = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pendingLikes, setPendingLikes] = useState(() => new Set());

  const limit = options.limit ?? 24;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/posts/feed", { params: { limit } });
      const nextItems = Array.isArray(res.data)
        ? res.data.map(normalizeItem).filter(Boolean)
        : [];
      setItems(nextItems);
      setError(null);
    } catch (err) {
      console.error("Fetch feed failed:", err);
      const message =
        err?.response?.data?.error ||
        "Không thể tải bản tin kết nối. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPost = useCallback(
    async ({ content, media, topics, visibility }) => {
      if (!content || !content.trim()) {
        return {
          success: false,
          message: "Vui lòng nhập nội dung trước khi đăng.",
        };
      }

      setCreating(true);
      try {
        const res = await api.post("/posts", {
          content,
          media,
          topics,
          visibility,
        });
        if (res.data?.post) {
          const nextItem = normalizeItem(res.data.post);
          setItems((prev) =>
            nextItem ? [nextItem, ...prev].slice(0, limit) : prev
          );
        }
        return { success: true };
      } catch (err) {
        console.error("Create post failed:", err);
        const message =
          err?.response?.data?.error ||
          "Không thể đăng bài viết ngay lúc này. Vui lòng thử lại.";
        return { success: false, message };
      } finally {
        setCreating(false);
      }
    },
    [limit]
  );

  const toggleLike = useCallback(async (postId, nextState) => {
    const action = nextState ? "like" : "unlike";
    setPendingLikes((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });

    try {
      const res = await api.post(`/posts/${postId}/like`, { action });
      const { likeCount, liked } = res.data || {};

      setItems((prev) =>
        prev.map((item) =>
          item?.id === postId
            ? {
                ...item,
                likeCount:
                  typeof likeCount === "number" ? likeCount : item.likeCount,
                liked: typeof liked === "boolean" ? liked : nextState,
              }
            : item
        )
      );

      return { success: true };
    } catch (err) {
      console.error("Toggle like failed:", err);
      const message =
        err?.response?.data?.error ||
        "Không thể cập nhật lượt thích. Vui lòng thử lại.";
      return { success: false, message };
    } finally {
      setPendingLikes((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  }, []);

  const liking = useMemo(() => new Set(pendingLikes), [pendingLikes]);

  return {
    feed: items,
    loading,
    error,
    refresh,
    createPost,
    creating,
    toggleLike,
    likesInFlight: liking,
  };
}
