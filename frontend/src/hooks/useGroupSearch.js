import { useState, useEffect } from "react";
import { api } from "../api";

const initialState = {
  results: [],
  loading: false,
  error: null,
  active: false,
};

export default function useGroupSearch(
  query,
  {
    enabled = true,
    minLength = 2,
    debounceMs = 350,
    limit = 10,
    refreshKey = 0,
  } = {}
) {
  const [state, setState] = useState(initialState);
  const trimmed = (query || "").trim();

  useEffect(() => {
    if (!enabled || trimmed.length < minLength) {
      setState((prev) => ({
        results: trimmed.length === 0 ? [] : prev.results,
        loading: false,
        error: null,
        active: false,
      }));
      return;
    }

    let cancelled = false;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      active: true,
    }));

    const timeout = setTimeout(async () => {
      try {
        const res = await api.get("/groups/search", {
          params: { q: trimmed, limit },
        });
        if (cancelled) return;
        setState({
          results: res.data,
          loading: false,
          error: null,
          active: true,
        });
      } catch (error) {
        if (cancelled) return;
        const message =
          error?.response?.data?.error ||
          "Không thể tìm kiếm hội nhóm lúc này.";
        setState({
          results: [],
          loading: false,
          error: message,
          active: true,
        });
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [enabled, trimmed, minLength, debounceMs, limit, refreshKey]);

  return state;
}

