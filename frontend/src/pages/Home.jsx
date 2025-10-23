import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import LeftRail from "../components/LeftRail";
import RightRail from "../components/RightRail";
import SuggestionPanel from "../components/SuggestionPanel";
import SearchResultsPanel from "../components/SearchResultsPanel";
import useFriendSuggestions from "../hooks/useFriendSuggestions";
import useFriendRequests from "../hooks/useFriendRequests";
import useNetworkInsights from "../hooks/useNetworkInsights";
import useFriendSearch from "../hooks/useFriendSearch";
import useFriendList from "../hooks/useFriendList";
import { api } from "../api";

const defaultFilters = {
  mutualMin: 0,
  city: "all",
  interest: "all",
  includeInterestMatches: true,
};

export default function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchRefreshIndex, setSearchRefreshIndex] = useState(0);
  const [banner, setBanner] = useState(null);

  const suggestionFilters = useMemo(
    () => ({
      mutualMin: filters.mutualMin,
      city: filters.city === "all" ? null : filters.city,
      interest: filters.interest === "all" ? null : filters.interest,
      includeInterestMatches: filters.includeInterestMatches,
    }),
    [filters]
  );

  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    refresh: refreshSuggestions,
    sendRequest,
    dismissSuggestion,
    lastAction,
  } = useFriendSuggestions(suggestionFilters, { limit: 24 });

  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    refresh: refreshRequests,
    accept: acceptRequest,
    reject: rejectRequest,
    cancel: cancelRequest,
  } = useFriendRequests();

  const {
    data: insights,
    loading: insightsLoading,
    error: insightsError,
    refresh: refreshInsights,
  } = useNetworkInsights();

  const {
    friends,
    loading: friendsLoading,
    error: friendsError,
    refresh: refreshFriends,
  } = useFriendList();

  const trimmedSearch = searchTerm.trim();
  const searchState = useFriendSearch(trimmedSearch, {
    enabled: trimmedSearch.length >= 2,
    debounceMs: 350,
    limit: 20,
    refreshKey: searchRefreshIndex,
  });

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    active: searchActive,
  } = searchState;

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await api.get("/auth/me");
      setProfile(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      setProfileError(null);
    } catch (error) {
      console.error("Fetch profile failed:", error);
      const message =
        error?.response?.data?.error ||
        "Khong the tai thong tin tai khoan. Vui long dang nhap lai.";
      setProfileError(message);
      setBanner({ type: "error", message });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const availableCities = useMemo(() => {
    const cities = new Set();
    if (profile?.city) cities.add(profile.city);
    suggestions.forEach((suggestion) => {
      if (suggestion.city) cities.add(suggestion.city);
    });
    friends.forEach((friend) => {
      if (friend?.city) cities.add(friend.city);
    });
    return Array.from(cities);
  }, [profile?.city, suggestions, friends]);

  const availableInterests = useMemo(() => {
    const interests = new Set();
    (profile?.interests || []).forEach((interest) =>
      interests.add(interest.trim())
    );
    suggestions.forEach((suggestion) => {
      (suggestion.sharedInterests || suggestion.interests || []).forEach(
        (interest) => interests.add(interest)
      );
    });
    friends.forEach((friend) => {
      (friend.interests || []).forEach((interest) => interests.add(interest));
    });
    return Array.from(interests);
  }, [profile?.interests, suggestions, friends]);

  const displaySuggestions = useMemo(() => {
    if (searchActive || !trimmedSearch) return suggestions;
    const normalized = trimmedSearch.toLowerCase();
    return suggestions.filter((suggestion) => {
      const city = suggestion.city?.toLowerCase() || "";
      const headline = suggestion.headline?.toLowerCase() || "";
      const matchName = suggestion.name.toLowerCase().includes(normalized);
      const matchCity = city.includes(normalized);
      const matchHeadline = headline.includes(normalized);
      const matchInterest = (suggestion.sharedInterests || [])
        .concat(suggestion.interests || [])
        .some((interest) => interest.toLowerCase().includes(normalized));
      return matchName || matchCity || matchHeadline || matchInterest;
    });
  }, [suggestions, trimmedSearch, searchActive]);

  const handleFilterChange = (nextFilters) => {
    setFilters((prev) => ({ ...prev, ...nextFilters }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  const triggerSearchRefresh = useCallback(() => {
    setSearchRefreshIndex((index) => index + 1);
  }, []);

  const handleSendRequest = async (targetId, message) => {
    const result = await sendRequest(targetId, message);
    if (result.success) {
      setBanner({
        type: "success",
        message: "Da gui loi moi ket ban.",
      });
      refreshRequests();
      refreshSuggestions();
      refreshInsights();
      refreshFriends();
      triggerSearchRefresh();
    } else {
      setBanner({ type: "error", message: result.message });
    }
  };

  const handleDismissSuggestion = async (targetId) => {
    const result = await dismissSuggestion(targetId);
    if (result.success) {
      setBanner({
        type: "info",
        message: "Da an goi y khoi danh sach cua ban.",
      });
      refreshSuggestions();
      refreshInsights();
      triggerSearchRefresh();
    } else {
      setBanner({ type: "error", message: result.message });
    }
  };

  const handleAcceptRequest = async (requestId) => {
    const result = await acceptRequest(requestId);
    if (result.success) {
      setBanner({
        type: "success",
        message: "Hai ban da tro thanh ban be!",
      });
      refreshRequests();
      refreshSuggestions();
      refreshInsights();
      refreshFriends();
      triggerSearchRefresh();
    } else {
      setBanner({ type: "error", message: result.message });
    }
  };

  const handleRejectRequest = async (requestId) => {
    const result = await rejectRequest(requestId);
    if (result.success) {
      setBanner({
        type: "info",
        message: "Da bo qua loi moi.",
      });
      refreshRequests();
      refreshInsights();
      refreshFriends();
      triggerSearchRefresh();
    } else {
      setBanner({ type: "error", message: result.message });
    }
  };

  const handleCancelRequest = async (requestId) => {
    const result = await cancelRequest(requestId);
    if (result.success) {
      setBanner({
        type: "info",
        message: "Da huy loi moi ket ban.",
      });
      refreshRequests();
      refreshInsights();
      refreshFriends();
      triggerSearchRefresh();
    } else {
      setBanner({ type: "error", message: result.message });
    }
  };

  const pendingCount = requests.incoming?.length || 0;

  const dismissBanner = () => setBanner(null);

  const refreshAll = () => {
    refreshSuggestions();
    refreshRequests();
    refreshInsights();
    refreshFriends();
    triggerSearchRefresh();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!banner) return undefined;
    const timer = window.setTimeout(() => setBanner(null), 4500);
    return () => window.clearTimeout(timer);
  }, [banner]);

  return (
    <div className="app-shell">
      <Topbar
        user={profile}
        loadingUser={profileLoading}
        pendingCount={pendingCount}
        onRefresh={refreshAll}
        onLogout={handleLogout}
        requests={requests}
        requestsLoading={requestsLoading}
        requestsError={requestsError}
        friends={friends}
        friendsLoading={friendsLoading}
        friendsError={friendsError}
        onAcceptRequest={handleAcceptRequest}
        onRejectRequest={handleRejectRequest}
        onCancelRequest={handleCancelRequest}
      />

      {banner && (
        <div className={`toast-banner toast-${banner.type}`}>
          <span>{banner.message}</span>
          <button
            onClick={dismissBanner}
            className="icon-button"
            aria-label="Dong thong bao"
            type="button"
          >
            x
          </button>
        </div>
      )}

      <div className="content-wrapper">
        <LeftRail
          profile={profile}
          loadingProfile={profileLoading}
          error={profileError}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          cities={availableCities}
          interests={availableInterests}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchActive={searchActive}
          searchLoading={searchLoading}
          searchCount={searchResults.length}
          insights={insights}
        />

        <main className="main-column">
          <SearchResultsPanel
            query={trimmedSearch}
            active={searchActive}
            loading={searchLoading}
            error={searchError}
            results={searchResults}
            onSendRequest={handleSendRequest}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
            onCancel={handleCancelRequest}
          />

          <SuggestionPanel
            profile={profile}
            suggestions={displaySuggestions}
            loading={suggestionsLoading || profileLoading}
            error={suggestionsError}
            onSendRequest={handleSendRequest}
            onDismiss={handleDismissSuggestion}
            onRefresh={refreshSuggestions}
            lastAction={lastAction}
            filters={filters}
            searchTerm={searchActive ? "" : searchTerm}
          />
        </main>

        <RightRail
          insights={insights}
          insightsLoading={insightsLoading}
          insightsError={insightsError}
          requests={requests}
          requestsLoading={requestsLoading}
          requestsError={requestsError}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
          onCancel={handleCancelRequest}
        />
      </div>
    </div>
  );
}
