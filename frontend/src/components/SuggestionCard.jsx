import React, { useState } from "react";

const fallbackAvatar =
  "https://api.dicebear.com/7.x/thumbs/svg?seed=suggestion";

const Icon = ({ path }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <path fill="currentColor" d={path} />
  </svg>
);

const ICONS = {
  location:
    "M12 2a7 7 0 00-7 7c0 5.28 7 13 7 13s7-7.72 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 112.5-2.5 2.5 2.5 0 01-2.5 2.5z",
  workplace:
    "M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2zm4-5h8a2 2 0 012 2v3H6V4a2 2 0 012-2z",
  people:
    "M16 11a4 4 0 10-4-4 4 4 0 004 4zm-8 0a4 4 0 10-4-4 4 4 0 004 4zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm8 0c-.34 0-.7.02-1.06.05A6.49 6.49 0 0120 19v3h8v-3c0-2.66-5.33-4-8-4z",
};

const reasonLabels = (suggestion) => {
  const labels = [];
  const strategies = suggestion.strategies || [];
  if (strategies.includes("mutual")) {
    labels.push("Goi y tu ban chung");
  }
  if ((suggestion.sharedInterests || []).length > 0) {
    labels.push("So thich tuong dong");
  }
  if (strategies.includes("global") && labels.length === 0) {
    labels.push("Thanh vien noi bat tren he thong");
  }
  return labels;
};

export default function SuggestionCard({ suggestion, onAdd, onDismiss }) {
  const [submitting, setSubmitting] = useState(false);

  const mutualCount = suggestion.mutualCount ?? 0;
  const mutualPreview = (suggestion.mutualFriends || [])
    .slice(0, 2)
    .map((friend) => friend.name)
    .join(", ");

  const sharedInterests =
    suggestion.sharedInterests?.length > 0
      ? suggestion.sharedInterests
      : suggestion.interests?.slice(0, 3) || [];

  const reasons = reasonLabels(suggestion);

  const handleAdd = async () => {
    if (!onAdd || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(suggestion.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (!onDismiss || submitting) return;
    onDismiss(suggestion.id);
  };

  return (
    <article className="friend-card">
      <div className="friend-card__media">
        <img
          src={suggestion.avatar || fallbackAvatar}
          alt={suggestion.name}
        />
      </div>
      <div className="friend-card__body">
        <header>
          <h2>{suggestion.name}</h2>
          {suggestion.headline && <p>{suggestion.headline}</p>}
        </header>

        <ul className="friend-card__meta">
          {suggestion.city && (
            <li>
              <Icon path={ICONS.location} />
              {suggestion.city}
            </li>
          )}
          {suggestion.workplace && (
            <li>
              <Icon path={ICONS.workplace} />
              {suggestion.workplace}
            </li>
          )}
          <li>
            <Icon path={ICONS.people} />
            {mutualCount} ban chung
            {mutualPreview && <small> ({mutualPreview})</small>}
          </li>
        </ul>

        {sharedInterests.length > 0 && (
          <div className="friend-card__tags">
            {sharedInterests.map((interest) => (
              <span key={interest} className="chip">
                {interest}
              </span>
            ))}
          </div>
        )}

        {reasons.length > 0 && (
          <div className="friend-card__reason">{reasons.join(" | ")}</div>
        )}
      </div>

      <footer className="friend-card__actions">
        <button
          type="button"
          className="button primary"
          onClick={handleAdd}
          disabled={submitting}
        >
          {submitting ? "Dang gui..." : "Ket ban"}
        </button>
        <button
          type="button"
          className="button ghost"
          onClick={handleDismiss}
          disabled={submitting}
        >
          Bo qua
        </button>
      </footer>
    </article>
  );
}
