import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

const initialState = {
  suggestions: [],
  loading: false,
  error: null,
};

const sanitizeParams = (params) => {
  const sanitized = { ...params };
  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "all"
    ) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

export default function useFriendSuggestions(filters, options = {}) {
  const [state, setState] = useState(initialState);
  const [lastAction, setLastAction] = useState(null);

  const fetchSuggestions = useCallback(
    async (override = {}) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = sanitizeParams({
          limit: options.limit ?? 12,
          ...filters,
          ...override,
        });
        const res = await api.get("/friends/suggestions", { params });
        setState({ suggestions: res.data, loading: false, error: null });
      } catch (error) {
        console.error("Fetch suggestions failed:", error);
        const message =
          error?.response?.data?.error ||
          "Không thể tải danh sách gợi ý. Vui lòng thử lại.";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    },
    [filters, options.limit]
  );

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const sendRequest = useCallback(async (targetId, message) => {
    try {
      await api.post("/friends/requests", { targetId, message });
      setState((prev) => ({
        ...prev,
        suggestions: prev.suggestions.filter((s) => s.id !== targetId),
      }));
      setLastAction({ type: "request", targetId });
      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        "Không thể gửi lời mời kết bạn. Vui lòng thử lại.";
      return { success: false, message };
    }
  }, []);

  const dismissSuggestion = useCallback(async (targetId) => {
    try {
      await api.post("/friends/suggestions/dismiss", { targetId });
      setState((prev) => ({
        ...prev,
        suggestions: prev.suggestions.filter((s) => s.id !== targetId),
      }));
      setLastAction({ type: "dismiss", targetId });
      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        "Không thể ẩn gợi ý lúc này.";
      return { success: false, message };
    }
  }, []);

  return {
    suggestions: state.suggestions,
    loading: state.loading,
    error: state.error,
    refresh: fetchSuggestions,
    sendRequest,
    dismissSuggestion,
    lastAction,
  };
}
