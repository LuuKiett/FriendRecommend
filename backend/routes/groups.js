import express from "express";
import { randomUUID } from "crypto";
import driver from "../neo4j.js";

const router = express.Router();

const userProjection = (alias = "u") => `
{
  id: coalesce(${alias}.id, elementId(${alias})),
  name: ${alias}.name,
  email: ${alias}.email,
  city: ${alias}.city,
  headline: ${alias}.headline,
  workplace: ${alias}.workplace,
  avatar: ${alias}.avatar
}
`;

const groupProjection = (alias = "g") => `
{
  id: coalesce(${alias}.id, elementId(${alias})),
  name: ${alias}.name,
  description: ${alias}.description,
  topics: coalesce(${alias}.topics, []),
  cover: ${alias}.cover,
  createdAt: CASE
    WHEN ${alias}.createdAt IS NULL THEN NULL
    ELSE toString(${alias}.createdAt)
  END
}
`;

const toPlainNumber = (value) => {
  if (value && typeof value.toNumber === "function") return value.toNumber();
  if (value && typeof value.toInt === "function") return value.toInt();
  if (value && typeof value.low === "number") return value.low;
  return Number.isFinite(value) ? value : 0;
};

const normalizeTopics = (topics = [], fallback = "") => {
  const normalized = new Set();

  if (Array.isArray(topics)) {
    topics
      .map((topic) => String(topic || "").trim())
      .filter(Boolean)
      .forEach((topic) => normalized.add(topic));
  }

  if (typeof fallback === "string") {
    fallback
      .split(/[,#;]/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
      .forEach((token) => normalized.add(token));
  }

  return Array.from(normalized)
    .map((topic) => (topic.length > 40 ? topic.slice(0, 40) : topic))
    .slice(0, 10);
};

const formatMembership = (record) => ({
  group: record.get("group"),
  membership: {
    role: record.get("role"),
    joinedAt: record.get("joinedAt"),
  },
  memberCount: toPlainNumber(record.get("memberCount")),
  friendMembers: record.get("friendMembers") || [],
});

router.get("/search", async (req, res) => {
  const { q = "", limit = 10 } = req.query || {};
  const term = String(q || "").trim();

  if (term.length === 0) {
    return res.json([]);
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      WITH toLower($term) AS term
      MATCH (me:User {email: $email})
      MATCH (group:Group)
      WITH me, group, term,
           toLower(coalesce(group.name, '')) AS nameLower,
           toLower(coalesce(group.description, '')) AS descriptionLower,
           CASE
             WHEN group.topics IS NULL THEN []
             WHEN NOT group.topics IS LIST THEN [t IN split(replace(replace(toLower(toString(group.topics)), '#', ''), ',', '|'), '|') WHERE trim(t) <> '' AND size(trim(t)) >= 2]
             ELSE [topic IN group.topics | toLower(topic)]
           END AS topicsLower,
           [i IN coalesce(me.interests, []) WHERE toLower(i) IN topicsLower] AS sharedTopics,
           CASE WHEN toLower(coalesce(group.name, '')) STARTS WITH term THEN 15 ELSE 0 END
           + CASE WHEN nameLower CONTAINS term THEN 10 ELSE 0 END
           + CASE WHEN descriptionLower CONTAINS term THEN 4 ELSE 0 END
           + CASE WHEN ANY(topic IN topicsLower WHERE topic CONTAINS term) THEN 5 ELSE 0 END AS baseScore
      WHERE baseScore > 0
      OPTIONAL MATCH (me)-[membership:MEMBER_OF]->(group)
      OPTIONAL MATCH (group)<-[:MEMBER_OF]-(member:User)
      WITH me, group, membership, sharedTopics, baseScore,
           collect(DISTINCT member) AS members
      WITH me, group, membership, sharedTopics, members, baseScore,
           size(members) AS memberCount,
           [member IN members WHERE member IS NOT NULL AND EXISTS { (member)-[:FRIEND_WITH]->(me) }] AS friendMembersFull
      WITH baseScore
           + CASE WHEN size(friendMembersFull) >= 5 THEN 8 WHEN size(friendMembersFull) > 0 THEN 4 ELSE 0 END
           + CASE WHEN size(sharedTopics) >= 2 THEN 4 WHEN size(sharedTopics) > 0 THEN 2 ELSE 0 END AS score,
           group,
           membership,
           sharedTopics,
           memberCount,
           size(friendMembersFull) AS friendMemberCount,
           friendMembersFull[0..4] AS friendMembersPreview
      RETURN {
        id: coalesce(group.id, elementId(group)),
        name: group.name,
        description: group.description,
        cover: group.cover,
        topics: coalesce(group.topics, []),
        memberCount: memberCount,
        friendMemberCount: friendMemberCount,
        friendMembers: [friend IN friendMembersPreview | {
          id: coalesce(friend.id, elementId(friend)),
          name: friend.name,
          email: friend.email,
          avatar: friend.avatar,
          headline: friend.headline
        }],
        sharedTopics: sharedTopics,
        isMember: membership IS NOT NULL,
        role: membership.role,
        joinedAt: CASE
          WHEN membership.joinedAt IS NULL THEN NULL
          ELSE toString(membership.joinedAt)
        END
      } AS groupResult,
      CASE WHEN membership IS NULL THEN 0 ELSE 1 END AS membershipOrder,
      friendMemberCount AS friendCountOrder,
      memberCount AS memberCountOrder,
      toLower(group.name) AS nameOrder,
      score
      ORDER BY score DESC, membershipOrder ASC, friendCountOrder DESC, memberCountOrder DESC, nameOrder ASC
      LIMIT toInteger($limit)
      `,
      {
        email: req.user.email,
        term,
        limit: Number(limit),
      }
    );

    const groups = result.records.map((record) => {
      const raw = record.get("groupResult") || {};
      return {
        ...raw,
        memberCount: toPlainNumber(raw.memberCount),
        friendMemberCount: toPlainNumber(raw.friendMemberCount),
        friendMembers: Array.isArray(raw.friendMembers)
          ? raw.friendMembers
          : [],
        sharedTopics: Array.isArray(raw.sharedTopics)
          ? raw.sharedTopics
          : [],
      };
    });

    res.json(groups);
  } catch (error) {
    console.error("Failed to search groups:", error);
    res.status(500).json({
      error: "Không thể tìm kiếm hội nhóm ngay lúc này.",
    });
  } finally {
    await session.close();
  }
});

router.post("/", async (req, res) => {
  const { name, description, topics = [], cover } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length < 3) {
    return res.status(400).json({
      error: "Vui lòng nhập tên hội nhóm (tối thiểu 3 ký tự).",
    });
  }

  const session = driver.session();
  try {
    const groupId = randomUUID();
    const normalizedTopics = normalizeTopics(topics, description);
    const coverUrl =
      typeof cover === "string" && cover.trim().length > 0 ? cover.trim() : null;

    const result = await session.run(
      `
      MATCH (creator:User {email: $email})
      CREATE (creator)-[:CREATED_GROUP {createdAt: datetime()}]->(group:Group {
        id: $groupId,
        name: $name,
        description: $description,
        topics: $topics,
        cover: $cover,
        createdAt: datetime()
      })
      MERGE (creator)-[membership:MEMBER_OF]->(group)
      ON CREATE SET membership.joinedAt = datetime(), membership.role = "owner"
      RETURN ${groupProjection("group")} AS group,
             membership.role AS role,
             toString(membership.joinedAt) AS joinedAt
      `,
      {
        email: req.user.email,
        groupId,
        name: name.trim(),
        description: description?.trim() || null,
        topics: normalizedTopics,
        cover: coverUrl,
      }
    );

    const record = result.records[0];
    res.json({
      success: true,
      group: record.get("group"),
      membership: {
        role: record.get("role"),
        joinedAt: record.get("joinedAt"),
      },
    });
  } catch (error) {
    console.error("Failed to create group:", error);
    res.status(500).json({
      error: "Không thể tạo hội nhóm. Vui lòng thử lại.",
    });
  } finally {
    await session.close();
  }
});

router.get("/mine", async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})-[membership:MEMBER_OF]->(group:Group)
      OPTIONAL MATCH (group)<-[:MEMBER_OF]-(friend:User)<-[:FRIEND_WITH]-(me)
      OPTIONAL MATCH (group)<-[:MEMBER_OF]-(member:User)
      WITH group,
           membership,
           collect(DISTINCT friend) AS friendMembers,
           COUNT(DISTINCT member) AS memberCount
      RETURN ${groupProjection("group")} AS group,
             membership.role AS role,
             toString(membership.joinedAt) AS joinedAt,
             memberCount,
             [friend IN friendMembers | ${userProjection("friend")}] AS friendMembers
      ORDER BY membership.joinedAt DESC
      `
    );

    res.json(result.records.map(formatMembership));
  } catch (error) {
    console.error("Failed to list my groups:", error);
    res.status(500).json({
      error: "Không thể tải danh sách hội nhóm của bạn.",
    });
  } finally {
    await session.close();
  }
});

router.get("/suggestions", async (req, res) => {
  const session = driver.session();
  const { limit = 12 } = req.query;

  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      CALL {
        WITH me
        MATCH (group:Group)<-[:MEMBER_OF]-(friend:User)<-[:FRIEND_WITH]-(me)
        WHERE NOT (me)-[:MEMBER_OF]->(group)
        WITH group, collect(DISTINCT friend) AS friendMembers
        RETURN group,
               friendMembers,
               size(friendMembers) AS friendCount,
               "friends" AS reason
        UNION
        WITH me
        MATCH (group:Group)
        WHERE NOT (me)-[:MEMBER_OF]->(group)
        OPTIONAL MATCH (group)<-[:MEMBER_OF]-(member:User)
        WITH me,
             group,
             collect(DISTINCT member) AS members
        WITH me,
             group,
             members,
             [i IN coalesce(me.interests, []) | toLower(i)] AS myInts,
             reduce(acc = [], m IN members | acc + [i IN coalesce(m.interests, []) | toLower(i)]) AS membersInts
        WITH me, group, myInts,
             [i IN membersInts WHERE i IS NOT NULL AND trim(i) <> ""] AS allMemberInts
        WITH group,
             [i IN myInts WHERE i IN allMemberInts] AS sharedTopics
        WHERE size(sharedTopics) > 0
        RETURN group, sharedTopics[0..3] AS friendMembers, size(sharedTopics) AS friendCount, "interests" AS reason
        UNION
        // Fallback popular groups if no friend/interest match
        WITH me
        MATCH (group:Group)
        WHERE NOT (me)-[:MEMBER_OF]->(group)
        OPTIONAL MATCH (group)<-[:MEMBER_OF]-(m:User)
        WITH group, COUNT(DISTINCT m) AS memberCount
        RETURN group, [] AS friendMembers, memberCount AS friendCount, "popular" AS reason
      }
      OPTIONAL MATCH (group)<-[:MEMBER_OF]-(member:User)
      WITH group,
           friendMembers,
           friendCount,
           reason,
           COUNT(DISTINCT member) AS memberCount
      RETURN ${groupProjection("group")} AS group,
             friendMembers,
             friendCount,
             memberCount,
             reason
      ORDER BY reason, friendCount DESC, memberCount DESC, toLower(group.name)
      LIMIT toInteger($limit)
      `,
      { email: req.user.email, limit: Number(limit) }
    );

    const suggestions = result.records.map((record) => {
      const reason = record.get("reason");
      const friendMembersRaw = record.get("friendMembers") || [];
      const friendMembers =
        reason === "friends"
          ? friendMembersRaw.map((friend) => friend.properties ?? friend)
          : [];
      const sharedTopics =
        reason === "interests" ? friendMembersRaw.map((topic) => ({ value: topic })) : [];

      return {
        group: record.get("group"),
        friendMembers: friendMembers.map((friend) => ({
          id: friend.id || friend.elementId,
          name: friend.name,
          email: friend.email,
          avatar: friend.avatar,
          headline: friend.headline,
        })),
        sharedTopics,
        friendCount: toPlainNumber(record.get("friendCount")),
        memberCount: toPlainNumber(record.get("memberCount")),
        reason,
      };
    });

    res.json(suggestions);
  } catch (error) {
    console.error("Failed to load group suggestions:", error);
    res.status(500).json({
      error: "Không thể gợi ý hội nhóm ngay lúc này.",
    });
  } finally {
    await session.close();
  }
});

router.get("/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      MATCH (group:Group)
      WHERE group.id = $groupId OR elementId(group) = $groupId OR group.groupId = $groupId
      OPTIONAL MATCH (me)-[membership:MEMBER_OF]->(group)
      OPTIONAL MATCH (group)<-[:MEMBER_OF]-(member:User)
      WITH me, group, membership, collect(DISTINCT member) AS members
      WITH me, group, membership, members,
           size(members) AS memberCount,
           [m IN members WHERE (m)-[:FRIEND_WITH]->(me) OR (me)-[:FRIEND_WITH]->(m)] AS friendMembers
      RETURN ${groupProjection("group")} AS group,
             membership.role AS role,
             toString(membership.joinedAt) AS joinedAt,
             memberCount,
             [friend IN friendMembers | ${userProjection("friend")}] AS friendMembers
      `,
      { email: req.user.email, groupId }
    );

    if (!result.records.length) {
      return res.status(404).json({ error: "Không tìm thấy hội nhóm." });
    }

    const record = result.records[0];
    res.json({
      group: record.get("group"),
      membership: {
        role: record.get("role") || null,
        joinedAt: record.get("joinedAt") || null,
      },
      memberCount: toPlainNumber(record.get("memberCount")),
      friendMembers: record.get("friendMembers") || [],
    });
  } catch (error) {
    console.error("Failed to get group detail:", error);
    res.status(500).json({ error: "Không thể tải thông tin hội nhóm." });
  } finally {
    await session.close();
  }
});

router.get("/:groupId/similar", async (req, res) => {
  const { groupId } = req.params;
  const { limit = 10 } = req.query;
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      MATCH (g:Group)
      WHERE g.id = $groupId OR elementId(g) = $groupId OR g.groupId = $groupId
      WITH me, g, coalesce(g.topics, []) AS gTopicsRaw
      WITH me, g,
           CASE
             WHEN gTopicsRaw IS NULL THEN []
             WHEN NOT gTopicsRaw IS LIST THEN [t IN split(replace(replace(toLower(toString(gTopicsRaw)), '#', ''), ',', '|'), '|') WHERE trim(t) <> '' AND size(trim(t)) >= 2]
             ELSE [t IN gTopicsRaw | toLower(t)]
           END AS gTopics
      MATCH (candidate:Group)
      WHERE candidate <> g
      OPTIONAL MATCH (me)-[:FRIEND_WITH]->(:User)-[:MEMBER_OF]->(candidate)
      WITH me, g, candidate, COUNT(*) AS friendInCandidate,
           CASE
             WHEN candidate.topics IS NULL THEN []
             WHEN NOT candidate.topics IS LIST THEN [t IN split(replace(replace(toLower(toString(candidate.topics)), '#', ''), ',', '|'), '|') WHERE trim(t) <> '' AND size(trim(t)) >= 2]
             ELSE [t IN candidate.topics | toLower(t)]
           END AS cTopics
      WITH candidate, friendInCandidate,
           size([t IN cTopics WHERE t IN gTopics]) AS sharedTopicCount
      OPTIONAL MATCH (candidate)<-[:MEMBER_OF]-(m:User)
      WITH candidate, friendInCandidate, sharedTopicCount, COUNT(DISTINCT m) AS memberCount
      RETURN ${groupProjection("candidate")} AS group,
             friendInCandidate AS friendCount,
             memberCount,
             sharedTopicCount
      ORDER BY friendCount DESC, sharedTopicCount DESC, memberCount DESC, toLower(candidate.name)
      LIMIT toInteger($limit)
      `,
      { email: req.user.email, groupId, limit: Number(limit) }
    );

    const suggestions = result.records.map((r) => ({
      group: r.get("group"),
      friendCount: toPlainNumber(r.get("friendCount")),
      memberCount: toPlainNumber(r.get("memberCount")),
      sharedTopicCount: toPlainNumber(r.get("sharedTopicCount")),
    }));
    res.json(suggestions);
  } catch (error) {
    console.error("Failed to load similar groups:", error);
    res.status(500).json({ error: "Không thể gợi ý hội nhóm tương tự." });
  } finally {
    await session.close();
  }
});

router.get("/:groupId/members", async (req, res) => {
  const { groupId } = req.params;
  const { limit = 30, skip = 0 } = req.query;
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      MATCH (group:Group)
      WHERE group.id = $groupId OR elementId(group) = $groupId OR group.groupId = $groupId
      MATCH (member:User)-[:MEMBER_OF]->(group)
      OPTIONAL MATCH (me)-[friendRel:FRIEND_WITH]->(member)
      WITH member, friendRel IS NOT NULL AS isFriend
      RETURN ${userProjection("member")} AS user, isFriend
      ORDER BY isFriend DESC, toLower(user.name) ASC
      SKIP toInteger($skip)
      LIMIT toInteger($limit)
      `,
      { email: req.user.email, groupId, limit: Number(limit), skip: Number(skip) }
    );

    const members = result.records.map((r) => ({
      user: r.get("user"),
      isFriend: Boolean(r.get("isFriend")),
    }));
    res.json(members);
  } catch (error) {
    console.error("Failed to list group members:", error);
    res.status(500).json({ error: "Không thể tải thành viên nhóm." });
  } finally {
    await session.close();
  }
});

router.get("/:groupId/member-suggestions", async (req, res) => {
  const { groupId } = req.params;
  const { limit = 12 } = req.query;
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      MATCH (group:Group)
      WHERE group.id = $groupId OR elementId(group) = $groupId OR group.groupId = $groupId
      MATCH (candidate:User)-[:MEMBER_OF]->(group)
      WHERE candidate.email <> $email
        AND NOT (me)-[:FRIEND_WITH]->(candidate)
        AND NOT (me)-[:REQUESTED]->(candidate)
        AND NOT (candidate)-[:REQUESTED]->(me)
        AND NOT (me)-[:DISMISSED]->(candidate)
      OPTIONAL MATCH (me)-[:FRIEND_WITH]->(mutual:User)-[:FRIEND_WITH]->(candidate)
      WITH candidate, COLLECT(DISTINCT mutual { .name, .email, .avatar }) AS mutualFriends
      RETURN {
        id: coalesce(candidate.id, elementId(candidate)),
        name: candidate.name,
        email: candidate.email,
        city: candidate.city,
        headline: candidate.headline,
        workplace: candidate.workplace,
        avatar: candidate.avatar,
        interests: coalesce(candidate.interests, [])
      } AS user,
      mutualFriends,
      size(mutualFriends) AS mutualCount
      ORDER BY mutualCount DESC, toLower(user.name) ASC
      LIMIT toInteger($limit)
      `,
      { email: req.user.email, groupId, limit: Number(limit) }
    );

    res.json(
      result.records.map((r) => ({
        user: r.get("user"),
        mutualFriends: r.get("mutualFriends") || [],
        mutualCount: Number(r.get("mutualCount")) || 0,
      }))
    );
  } catch (error) {
    console.error("Failed to load member-based suggestions:", error);
    res.status(500).json({ error: "Không thể gợi ý kết nối từ nhóm." });
  } finally {
    await session.close();
  }
});

router.post("/:groupId/join", async (req, res) => {
  const { groupId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      MATCH (group:Group)
      WHERE group.id = $groupId OR elementId(group) = $groupId
      MERGE (me)-[membership:MEMBER_OF]->(group)
      ON CREATE SET membership.joinedAt = datetime(), membership.role = "member", membership.isNew = true
      WITH me, group, membership
      OPTIONAL MATCH (group)<-[:MEMBER_OF]-(friend:User)<-[:FRIEND_WITH]-(me)
      OPTIONAL MATCH (group)<-[:MEMBER_OF]-(member:User)
      WITH group,
           membership,
           collect(DISTINCT friend) AS friendMembers,
           COUNT(DISTINCT member) AS memberCount,
           coalesce(membership.isNew, false) AS isNew
      REMOVE membership.isNew
      RETURN ${groupProjection("group")} AS group,
             membership.role AS role,
             toString(membership.joinedAt) AS joinedAt,
             memberCount,
             [friend IN friendMembers | ${userProjection("friend")}] AS friendMembers,
             isNew AS createdNow
      `,
      { email: req.user.email, groupId }
    );

    if (!result.records.length) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy hội nhóm để tham gia." });
    }

    const record = result.records[0];
    res.json({
      success: true,
      group: record.get("group"),
      membership: {
        role: record.get("role"),
        joinedAt: record.get("joinedAt"),
        isNew: Boolean(record.get("createdNow")),
      },
      memberCount: toPlainNumber(record.get("memberCount")),
      friendMembers: record.get("friendMembers") || [],
    });
  } catch (error) {
    console.error("Failed to join group:", error);
    res.status(500).json({
      error: "Không thể tham gia hội nhóm. Vui lòng thử lại.",
    });
  } finally {
    await session.close();
  }
});

router.delete("/:groupId/membership", async (req, res) => {
  const { groupId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})-[membership:MEMBER_OF]->(group:Group)
      WHERE group.id = $groupId OR elementId(group) = $groupId
      WITH me, membership, group
      OPTIONAL MATCH (group)<-[:CREATED_GROUP]-(owner:User)
      WITH me, membership, group, COUNT(owner) AS ownerCount
      WITH membership, group, ownerCount,
           EXISTS((me)-[:CREATED_GROUP]->(group)) AS isOwner
      WHERE NOT (isOwner AND ownerCount = 1)
      DELETE membership
      RETURN group.id AS id
      `,
      { email: req.user.email, groupId }
    );

    if (!result.records.length) {
      return res.status(400).json({
        error:
          "Bạn không thể rời nhóm khi đang là quản trị viên duy nhất. Hãy phân quyền cho người khác trước.",
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to leave group:", error);
    res.status(500).json({
      error: "Không thể rời hội nhóm vào lúc này.",
    });
  } finally {
    await session.close();
  }
});

export default router;
