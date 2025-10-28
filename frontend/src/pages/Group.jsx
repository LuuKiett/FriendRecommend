import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGroups from "../hooks/useGroups";

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const {
    getGroupDetail,
    getSimilarGroups,
    joinGroup,
    leaveGroup,
    pending,
    getGroupMembers,
    getGroupMemberSuggestions,
  } = useGroups();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberSuggestions, setMemberSuggestions] = useState([]);

  const isPending = useMemo(() => pending.has(groupId), [pending, groupId]);
  const isMember = Boolean(detail?.membership?.role);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [d, s, m, ms] = await Promise.all([
      getGroupDetail(groupId),
      getSimilarGroups(groupId, 8),
      getGroupMembers(groupId, { limit: 24 }),
      getGroupMemberSuggestions(groupId, 12),
    ]);
    if (d.success) setDetail(d.data);
    else setError(d.message);
    if (s.success) setSimilar(s.data);
    if (m.success) setMembers(m.data);
    if (ms.success) setMemberSuggestions(ms.data);
    setLoading(false);
  }, [groupId, getGroupDetail, getSimilarGroups]);

  useEffect(() => {
    if (!groupId) return;
    refresh();
  }, [groupId, refresh]);

  const handleJoin = async () => {
    const res = await joinGroup(groupId);
    if (res.success) refresh();
  };

  const handleLeave = async () => {
    const res = await leaveGroup(groupId);
    if (res.success) navigate("/", { replace: true });
  };

  if (loading) return <div className="page">Đang tải hội nhóm...</div>;
  if (error) return <div className="page error">{error}</div>;
  if (!detail) return null;

  const g = detail.group;

  return (
    <div className="page group-page">
      <header className="group-hero">
        {g?.cover && <img src={g.cover} alt={g.name} />}
        <div className="group-hero__text">
          <h1>{g?.name}</h1>
          {g?.description && <p>{g.description}</p>}
          <div className="group-hero__meta">
            <span>{detail.memberCount} thành viên</span>
            {detail.friendMembers?.length > 0 && (
              <span>{detail.friendMembers.length} bạn của bạn ở đây</span>
            )}
          </div>
          <div className="group-hero__actions">
            {isMember ? (
              <button
                type="button"
                className="button ghost"
                disabled={isPending}
                onClick={handleLeave}
              >
                Rời nhóm
              </button>
            ) : (
              <button
                type="button"
                className="button primary"
                disabled={isPending}
                onClick={handleJoin}
              >
                Tham gia nhóm
              </button>
            )}
          </div>
        </div>
      </header>

      <section>
        <h2>Bạn bè trong nhóm</h2>
        {detail.friendMembers?.length === 0 ? (
          <p>Chưa có bạn bè nào của bạn trong nhóm này.</p>
        ) : (
          <ul className="avatar-list">
            {detail.friendMembers.map((m) => (
              <li key={m.id || m.email}>
                <img src={m.avatar} alt={m.name} title={m.name} />
                <span>{m.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Thành viên</h2>
        {members.length === 0 ? (
          <p>Chưa có thành viên nào.</p>
        ) : (
          <ul className="member-grid">
            {members.map((m) => (
              <li key={m.user.id || m.user.email}>
                <img src={m.user.avatar} alt={m.user.name} />
                <div>
                  <strong>{m.user.name}</strong>
                  {m.user.city && <span>{m.user.city}</span>}
                </div>
                {m.isFriend ? (
                  <span className="status-pill status-friend">Bạn bè</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Gợi ý kết nối từ nhóm</h2>
        {memberSuggestions.length === 0 ? (
          <p>Chưa có gợi ý phù hợp.</p>
        ) : (
          <ul className="interest-suggestion-list">
            {memberSuggestions.map((s) => (
              <li key={s.user.id} className="interest-suggestion">
                <div className="interest-suggestion__body">
                  <strong>{s.user.name}</strong>
                  {s.user.headline && <p>{s.user.headline}</p>}
                  {s.mutualCount > 0 && (
                    <span>{s.mutualCount} bạn chung</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Gợi ý nhóm tương tự (bạn bè đang tham gia)</h2>
        {similar.length === 0 ? (
          <p>Chưa có gợi ý phù hợp.</p>
        ) : (
          <div className="suggestion-grid group-grid">
            {similar.map((s) => (
              <article
                key={s.group.id}
                className="group-card"
                onClick={() => navigate(`/groups/${s.group.id}`)}
              >
                {s.group.cover && (
                  <div className="group-card__cover">
                    <img src={s.group.cover} alt={s.group.name} />
                  </div>
                )}
                <div className="group-card__body">
                  <h4>{s.group.name}</h4>
                  <div className="group-card__meta">
                    <span>{s.memberCount} thành viên</span>
                    {s.friendCount > 0 && (
                      <span>{s.friendCount} bạn đang tham gia</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


