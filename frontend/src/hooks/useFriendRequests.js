import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

const initialRequests = { incoming: [], outgoing: [] };

export default function useFriendRequests() {
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/friends/requests");
      setRequests(res.data);
      setError(null);
    } catch (err) {
      console.error("Fetch requests failed:", err);
      const message =
        err?.response?.data?.error ||
        "Không thể tải danh sách lời mời. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const accept = useCallback(
    async (requestId) => {
      try {
        await api.patch(`/friends/requests/${requestId}`, { action: "accept" });
        await refresh();
        return { success: true };
      } catch (err) {
        const message =
          err?.response?.data?.error ||
          "Không thể chấp nhận lời mời lúc này.";
        return { success: false, message };
      }
    },
    [refresh]
  );

  const reject = useCallback(
    async (requestId) => {
      try {
        await api.patch(`/friends/requests/${requestId}`, {
          action: "reject",
        });
        await refresh();
        return { success: true };
      } catch (err) {
        const message =
          err?.response?.data?.error ||
          "Không thể từ chối lời mời lúc này.";
        return { success: false, message };
      }
    },
    [refresh]
  );

  const cancel = useCallback(
    async (requestId) => {
      try {
        await api.delete(`/friends/requests/${requestId}`);
        await refresh();
        return { success: true };
      } catch (err) {
        const message =
          err?.response?.data?.error ||
          "Không thể hủy lời mời lúc này.";
        return { success: false, message };
      }
    },
    [refresh]
  );

  return { requests, loading, error, refresh, accept, reject, cancel };
}
