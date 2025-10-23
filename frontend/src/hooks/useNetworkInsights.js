import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export default function useNetworkInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/friends/insights");
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("Fetch insights failed:", err);
      const message =
        err?.response?.data?.error ||
        "Không thể tải thống kê mạng lưới. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
