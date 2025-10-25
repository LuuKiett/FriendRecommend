import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

const initialState = {
  suggestions: [],
  loading: false,
  error: null,
};

export default function useSharedInterestSuggestions(limit = 6) {
  const [state, setState] = useState(initialState);

  const fetchSuggestions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await api.get("/friends/suggestions/interest", {
        params: { limit },
      });
      setState({ suggestions: res.data, loading: false, error: null });
    } catch (error) {
      console.error("Fetch shared interest suggestions failed:", error);
      const message =
        error?.response?.data?.error ||
        "Không thể tải danh sách gợi ý theo sở thích chung.";
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [limit]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions: state.suggestions,
    loading: state.loading,
    error: state.error,
    refresh: fetchSuggestions,
  };
}
