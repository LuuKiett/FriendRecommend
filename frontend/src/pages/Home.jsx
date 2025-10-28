import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import LeftRail from "../components/LeftRail";
import RightRail from "../components/RightRail";
import SuggestionPanel from "../components/SuggestionPanel";
import SearchResultsPanel from "../components/SearchResultsPanel";
import PostFeed from "../components/PostFeed";
import useFriendSuggestions from "../hooks/useFriendSuggestions";
import useFriendRequests from "../hooks/useFriendRequests";
import useNetworkInsights from "../hooks/useNetworkInsights";
import useFriendSearch from "../hooks/useFriendSearch";
import useFriendList from "../hooks/useFriendList";
import usePostFeed from "../hooks/usePostFeed";
import useGroups from "../hooks/useGroups";
import useSharedInterestSuggestions from "../hooks/useSharedInterestSuggestions";
import useGroupSearch from "../hooks/useGroupSearch";
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

  const {
    suggestions: sharedInterestSuggestions,
    loading: sharedInterestLoading,
    error: sharedInterestError,
    refresh: refreshSharedInterestSuggestions,
  } = useSharedInterestSuggestions();

  const trimmedSearch = searchTerm.trim();
  const suggestionsEnabled = true;
  const friendSearchState = useFriendSearch(trimmedSearch, {
    enabled: suggestionsEnabled,
    debounceMs: 350,
    limit: 20,
    refreshKey: searchRefreshIndex,
  });

  const {
    results: userSearchResults,
    loading: friendSearchLoading,
    error: friendSearchError,
    active: friendSearchActive,
  } = friendSearchState;

  const groupSearchState = useGroupSearch(trimmedSearch, {
    enabled: suggestionsEnabled,
    debounceMs: 350,
    limit: 12,
    refreshKey: searchRefreshIndex,
  });

  const {
    results: groupSearchResults,
    loading: groupSearchLoading,
    error: groupSearchError,
    active: groupSearchActive,
  } = groupSearchState;

  const combinedSearchActive = friendSearchActive || groupSearchActive;
  const combinedSearchLoading = friendSearchLoading || groupSearchLoading;
  const combinedSearchError = friendSearchError || groupSearchError;
  const totalSearchResults =
    (Array.isArray(userSearchResults) ? userSearchResults.length : 0) +
    (Array.isArray(groupSearchResults) ? groupSearchResults.length : 0);

  const suggestionFilters = useMemo(
    () => ({
      mutualMin: filters.mutualMin,
      city: filters.city === "all" ? null : filters.city,
      interest: filters.interest === "all" ? null : filters.interest,
      includeInterestMatches: filters.includeInterestMatches,
      keyword: trimmedSearch.length >= 2 ? trimmedSearch : null,
    }),
    [filters, trimmedSearch]
  );

  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    refresh: refreshSuggestions,
    sendRequest,
    dismissSuggestion,
    lastAction,
  } = useFriendSuggestions(suggestionFilters, {
    limit: 24,
    enabled: suggestionsEnabled,
  });

  const {
    feed,
    loading: feedLoading,
    error: feedError,
    refresh: refreshFeed,
    createPost,
    creating: creatingPost,
    toggleLike: toggleFeedLike,
    likesInFlight: postLikesInFlight,
  } = usePostFeed({ limit: 30 });

  const {
    mine: myGroups,
    suggestions: groupSuggestions,
    loading: groupsLoading,
    error: groupsError,
    refresh: refreshGroups,
    createGroup,
    creating: creatingGroup,
    joinGroup,
    leaveGroup,
    pending: groupsPending,
  } = useGroups({ limit: 8 });

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
        "Không thể tải thông tin tài khoản. Vui lòng đăng nhập lại.";
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
    if (!suggestionsEnabled) return [];
    if (!trimmedSearch) return suggestions;
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
  }, [
    suggestionsEnabled,
    suggestions,
    trimmedSearch,
    combinedSearchActive,
  ]);

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
        message: "Đã gửi lời mời kết bạn.",
      });
      refreshRequests();
      refreshSuggestions();
      refreshSharedInterestSuggestions();
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
        message: "Đã ẩn gợi ý khỏi danh sách của bạn.",
      });
      refreshSuggestions();
      refreshSharedInterestSuggestions();
      refreshInsights();
      refreshFriends();
      triggerSearchRefresh();
    } else {
      setBanner({ type: "error", message: result.message });
    }
  };

  const handleCreatePost = useCallback(
    async (payload) => {
      const result = await createPost(payload);
      if (result.success) {
        setBanner({
          type: "success",
          message: "Đã đăng bài viết mới.",
        });
        refreshFeed();
      } else if (result.message) {
        setBanner({ type: "error", message: result.message });
      }
      return result;
    },
    [createPost, refreshFeed]
  );

  const handleToggleLike = useCallback(
    async (postId, nextState) => {
      const result = await toggleFeedLike(postId, nextState);
      if (!result.success && result.message) {
        setBanner({ type: "error", message: result.message });
      }
    },
    [toggleFeedLike]
  );

  const handleCreateGroup = useCallback(
    async (payload) => {
      const result = await createGroup(payload);
      if (result.success) {
        setBanner({
          type: "success",
          message: "Đã tạo hội nhóm mới.",
        });
        refreshGroups();
      } else if (result.message) {
        setBanner({ type: "error", message: result.message });
      }
      return result;
    },
    [createGroup, refreshGroups]
  );

  const handleJoinGroup = useCallback(
    async (groupId) => {
      const result = await joinGroup(groupId);
      if (result.success) {
        setBanner({
          type: "success",
          message: "Đã tham gia hội nhóm.",
        });
        refreshGroups();
      } else if (result.message) {
        setBanner({ type: "error", message: result.message });
      }
    },
    [joinGroup, refreshGroups]
  );

  const handleLeaveGroup = useCallback(
    async (groupId) => {
      const result = await leaveGroup(groupId);
      if (result.success) {
        setBanner({
          type: "info",
          message: "Bạn đã rời hội nhóm.",
        });
        refreshGroups();
      } else if (result.message) {
        setBanner({ type: "error", message: result.message });
      }
    },
    [leaveGroup, refreshGroups]
  );

  const handleAcceptRequest = async (requestId) => {
    const result = await acceptRequest(requestId);
    if (result.success) {
      setBanner({
        type: "success",
        message: "Hai bạn đã trở thành bạn bè!",
      });
      refreshRequests();
      refreshSuggestions();
      refreshSharedInterestSuggestions();
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
        message: "Đã bỏ qua lời mời.",
      });
      refreshRequests();
      refreshSharedInterestSuggestions();
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
        message: "Đã hủy lời mời kết bạn.",
      });
      refreshRequests();
      refreshSharedInterestSuggestions();
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
    refreshSharedInterestSuggestions();
    refreshFeed();
    refreshGroups();
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchUsers={userSearchResults}
        searchGroups={groupSearchResults}
        searchActive={combinedSearchActive}
        searchLoading={combinedSearchLoading}
        searchError={combinedSearchError}
        onSendRequest={handleSendRequest}
        onJoinGroup={handleJoinGroup}
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
            aria-label="Đóng thông báo"
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
          searchActive={combinedSearchActive}
          searchLoading={combinedSearchLoading}
          searchCount={totalSearchResults}
          insights={insights}
          groups={myGroups}
          onCreateGroup={handleCreateGroup}
          creatingGroup={creatingGroup}
          onLeaveGroup={handleLeaveGroup}
          pendingGroups={groupsPending}
        />

        <main className="main-column">
          <PostFeed
            profile={profile}
            feed={feed}
            loading={feedLoading}
            error={feedError}
            onRefresh={refreshFeed}
            onCreatePost={handleCreatePost}
            creating={creatingPost}
            onToggleLike={handleToggleLike}
            likesInFlight={postLikesInFlight}
            trendingTopics={insights?.topPostTopics}
            onSendRequest={(targetId) => handleSendRequest(targetId)}
          />

          <SearchResultsPanel
            query={trimmedSearch}
            active={combinedSearchActive}
            userLoading={friendSearchLoading}
            groupLoading={groupSearchLoading}
            userError={friendSearchError}
            groupError={groupSearchError}
            userResults={userSearchResults}
            groupResults={groupSearchResults}
            onSendRequest={handleSendRequest}
            onJoinGroup={handleJoinGroup}
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
            searchTerm={
              suggestionsEnabled && !combinedSearchActive
                ? trimmedSearch
                : ""
            }
            searchEnabled={suggestionsEnabled}
          />
        </main>

        <RightRail
          insights={insights}
          insightsLoading={insightsLoading}
          insightsError={insightsError}
          requests={requests}
          requestsLoading={requestsLoading}
          requestsError={requestsError}
          sharedInterestSuggestions={sharedInterestSuggestions}
          sharedInterestLoading={sharedInterestLoading}
          sharedInterestError={sharedInterestError}
          onSendRequest={handleSendRequest}
          onRefreshSharedInterests={refreshSharedInterestSuggestions}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
          onCancel={handleCancelRequest}
          groupSuggestions={groupSuggestions}
          groupsLoading={groupsLoading}
          groupsError={groupsError}
          onJoinGroup={handleJoinGroup}
          pendingGroups={groupsPending}
        />

      </div>
    </div>
  );
}

