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
             apoc.coll.intersection(
               coalesce(me.interests, []),
               reduce(acc = [], member IN members | acc + coalesce(member.interests, []))
             ) AS sharedTopics
        WHERE size(sharedTopics) > 0
        WITH group,
             sharedTopics[0..3] AS friendMembers,
             size(sharedTopics) AS friendCount,
             "interests" AS reason
        RETURN group, friendMembers, friendCount, reason
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
