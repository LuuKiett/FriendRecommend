import { useState, useEffect } from "react";
import { api } from "../api";

export default function useFriendSuggestions(name) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState([]);
  const [hidden, setHidden] = useState([]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recommend/${name}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = (user) => setSent([...sent, user]);
  const hideUser = (user) => setHidden([...hidden, user]);

  useEffect(() => {
    fetchSuggestions();
  }, [name]);

  const visibleSuggestions = suggestions.filter(
    (u) => !hidden.includes(u) && !sent.includes(u)
  );

  return { visibleSuggestions, loading, sendRequest, hideUser };
}
