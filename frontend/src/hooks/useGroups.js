import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";

const mapMembership = (item) => {
  if (!item) return null;
  return {
    group: item.group,
    membership: item.membership,
    memberCount: item.memberCount ?? 0,
    friendMembers: item.friendMembers || [],
  };
};

const mapSuggestion = (item) => {
  if (!item) return null;
  return {
    group: item.group,
    friendMembers: item.friendMembers || [],
    sharedTopics: item.sharedTopics || [],
    friendCount: item.friendCount ?? 0,
    memberCount: item.memberCount ?? 0,
    reason: item.reason,
  };
};

export default function useGroups(options = {}) {
  const [mine, setMine] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pendingGroups, setPendingGroups] = useState(() => new Set());

  const limit = options.limit ?? 12;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [mineRes, suggestionRes] = await Promise.all([
        api.get("/groups/mine"),
        api.get("/groups/suggestions", { params: { limit } }),
      ]);

      setMine(
        Array.isArray(mineRes.data)
          ? mineRes.data.map(mapMembership).filter(Boolean)
          : []
      );
      setSuggestions(
        Array.isArray(suggestionRes.data)
          ? suggestionRes.data.map(mapSuggestion).filter(Boolean)
          : []
      );
      setError(null);
    } catch (err) {
      console.error("Fetch groups failed:", err);
      const message =
        err?.response?.data?.error ||
        "Không thể tải thông tin hội nhóm. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markPending = useCallback((groupId, active) => {
    setPendingGroups((prev) => {
      const next = new Set(prev);
      if (active) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }
      return next;
    });
  }, []);

  const createGroup = useCallback(
    async (payload) => {
      if (!payload?.name || !payload.name.trim()) {
        return {
          success: false,
          message: "Tên hội nhóm phải có ít nhất 3 ký tự.",
        };
      }

      setCreating(true);
      try {
        const res = await api.post("/groups", payload);
        if (res.data?.group) {
          const membership = mapMembership({
            group: res.data.group,
            membership: res.data.membership,
            memberCount: 1,
            friendMembers: [],
          });
          setMine((prev) =>
            membership ? [membership, ...prev] : prev
          );
          setSuggestions((prev) =>
            prev.filter(
              (item) => item.group?.id !== res.data.group?.id
            )
          );
        }
        return { success: true };
      } catch (err) {
        console.error("Create group failed:", err);
        const message =
          err?.response?.data?.error ||
          "Không thể tạo hội nhóm. Vui lòng thử lại.";
        return { success: false, message };
      } finally {
        setCreating(false);
      }
    },
    []
  );

  const joinGroup = useCallback(async (groupId) => {
    if (!groupId) {
      return { success: false, message: "Thiếu mã hội nhóm." };
    }

    markPending(groupId, true);
    try {
      const res = await api.post(`/groups/${groupId}/join`);
      const membership = mapMembership({
        group: res.data?.group,
        membership: res.data?.membership,
        memberCount: res.data?.memberCount,
        friendMembers: res.data?.friendMembers,
      });

      if (membership) {
        setMine((prev) => {
          const exists = prev.some(
            (item) => item.group?.id === membership.group?.id
          );
          return exists
            ? prev.map((item) =>
                item.group?.id === membership.group?.id ? membership : item
              )
            : [membership, ...prev];
        });
      }

      setSuggestions((prev) =>
        prev.filter((item) => item.group?.id !== groupId)
      );

      return { success: true };
    } catch (err) {
      console.error("Join group failed:", err);
      const message =
        err?.response?.data?.error ||
        "Không thể tham gia nhóm. Vui lòng thử lại.";
      return { success: false, message };
    } finally {
      markPending(groupId, false);
    }
  }, [markPending]);

  const leaveGroup = useCallback(async (groupId) => {
    if (!groupId) {
      return { success: false, message: "Thiếu mã hội nhóm." };
    }

    markPending(groupId, true);
    try {
      await api.delete(`/groups/${groupId}/membership`);
      setMine((prev) =>
        prev.filter((item) => item.group?.id !== groupId)
      );
      return { success: true };
    } catch (err) {
      console.error("Leave group failed:", err);
      const message =
        err?.response?.data?.error ||
        "Không thể rời hội nhóm. Vui lòng thử lại.";
      return { success: false, message };
    } finally {
      markPending(groupId, false);
    }
  }, [markPending]);

  const pending = useMemo(() => new Set(pendingGroups), [pendingGroups]);

  return {
    mine,
    suggestions,
    loading,
    error,
    refresh,
    createGroup,
    creating,
    joinGroup,
    leaveGroup,
    pending,
  };
}
