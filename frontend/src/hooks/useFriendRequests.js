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
        "Khong the tai danh sach loi moi. Vui long thu lai.";
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
          "Khong the chap nhan loi moi luc nay.";
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
          "Khong the tu choi loi moi luc nay.";
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
          "Khong the huy loi moi luc nay.";
        return { success: false, message };
      }
    },
    [refresh]
  );

  return { requests, loading, error, refresh, accept, reject, cancel };
}
