import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export default function useFriendList() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/friends/list");
      setFriends(res.data);
      setError(null);
    } catch (err) {
      console.error("Fetch friend list failed:", err);
      const message =
        err?.response?.data?.error ||
        "Khong the lay danh sach ban be luc nay.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { friends, loading, error, refresh };
}
