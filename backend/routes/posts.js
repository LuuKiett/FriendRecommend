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

const postProjection = (alias = "post") => `
{
  id: coalesce(${alias}.id, elementId(${alias})),
  content: ${alias}.content,
  media: ${alias}.media,
  topics: coalesce(${alias}.topics, []),
  visibility: coalesce(${alias}.visibility, "friends"),
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

const normalizeTopics = (topics, content = "") => {
  const normalized = new Set();

  if (Array.isArray(topics)) {
    topics
      .map((topic) => String(topic || "").trim())
      .filter(Boolean)
      .forEach((topic) => normalized.add(topic));
  }

  if (typeof content === "string") {
    const hashtagRegex = /#([\p{L}\p{N}_-]{2,30})/giu;
    let match = hashtagRegex.exec(content);
    while (match) {
      normalized.add(match[1]);
      match = hashtagRegex.exec(content);
    }
  }

  return Array.from(normalized).slice(0, 12);
};

const mapRecords = (records, key) => records.map((record) => record.get(key));

const mergeFeedItems = (items) => {
  const merged = new Map();

  items.forEach((item) => {
    if (!item?.post) return;
    const id = item.post.id;
    const existing = merged.get(id);
    if (!existing) {
      merged.set(id, {
        ...item,
        reasons: [...(item.reasons || [])],
        friendHighlights: [...(item.friendHighlights || [])],
      });
      return;
    }

    const combinedReasons = [...existing.reasons];
    (item.reasons || []).forEach((reason) => {
      const duplicate = combinedReasons.find(
        (current) => current.type === reason.type
      );
      if (duplicate) {
        duplicate.friends = [
          ...(duplicate.friends || []),
          ...(reason.friends || []),
        ].filter(
          (value, index, array) =>
            value && array.findIndex((candidate) => candidate.id === value.id) === index
        );
        duplicate.friendCount = duplicate.friends?.length || duplicate.friendCount;
      } else {
        combinedReasons.push({ ...reason });
      }
    });

    const friendHighlights = [
      ...(existing.friendHighlights || []),
      ...(item.friendHighlights || []),
    ].filter(
      (value, index, array) =>
        value && array.findIndex((candidate) => candidate.id === value.id) === index
    );

    merged.set(id, {
      ...existing,
      likeCount: Math.max(existing.likeCount || 0, item.likeCount || 0),
      liked: existing.liked || item.liked,
      reasons: combinedReasons,
      friendHighlights,
      mutualFriends:
        existing.mutualFriends?.length || item.mutualFriends?.length
          ? [
              ...(existing.mutualFriends || []),
              ...(item.mutualFriends || []),
            ].filter(
              (value, index, array) =>
                value &&
                array.findIndex((candidate) => candidate.id === value.id) === index
            )
          : undefined,
      mutualCount: Math.max(existing.mutualCount || 0, item.mutualCount || 0),
    });
  });

  return Array.from(merged.values());
};

const computeScore = (item) => {
  const createdAt = item.post?.createdAt
    ? Date.parse(item.post.createdAt)
    : Date.now();
  const ageHours = Math.max(
    1,
    (Date.now() - createdAt) / (1000 * 60 * 60)
  );

  let score = 0;
  score += (item.likeCount || 0) * 1.5;
  score += (item.friendHighlights?.length || 0) * 6;
  score += (item.reasons || []).some((reason) => reason.type === "friend_post")
    ? 4
    : 0;
  score += (item.reasons || []).some((reason) => reason.type === "friend_like")
    ? 5
    : 0;
  score += (item.mutualCount || 0);

  // Penalize older posts.
  score /= Math.pow(ageHours, 0.25);

  return score;
};

router.post("/", async (req, res) => {
  const { content, media, topics = [], visibility = "friends" } =
    req.body || {};

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({
      error: "Vui lòng nhập nội dung bài viết.",
    });
  }

  const session = driver.session();
  try {
    const normalizedTopics = normalizeTopics(topics, content).map((topic) =>
      topic.length > 40 ? topic.slice(0, 40) : topic
    );
    const postId = randomUUID();
    const allowedVisibilities = new Set(["friends", "public", "private"]);
    const normalizedVisibility = allowedVisibilities.has(visibility)
      ? visibility
      : "friends";
    const mediaUrl =
      typeof media === "string" && media.trim().length > 0
        ? media.trim()
        : null;

    const result = await session.run(
      `
      MATCH (author:User {email: $email})
      CREATE (author)-[:POSTED]->(post:Post {
        id: $postId,
        content: $content,
        media: $media,
        topics: $topics,
        visibility: $visibility,
        createdAt: datetime()
      })
      RETURN ${postProjection("post")} AS post, ${userProjection("author")} AS author
      `,
      {
        email: req.user.email,
        postId,
        content: content.trim(),
        media: mediaUrl,
        topics: normalizedTopics,
        visibility: normalizedVisibility,
      }
    );

    if (!result.records.length) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy thông tin người dùng." });
    }

    const record = result.records[0];
    res.json({
      success: true,
      post: {
        post: record.get("post"),
        author: record.get("author"),
        likeCount: 0,
        liked: false,
        reasons: [
          {
            type: "author",
            friends: [record.get("author")],
          },
        ],
      },
    });
  } catch (error) {
    console.error("Failed to create post:", error);
    res.status(500).json({
      error: "Không thể đăng bài viết ngay lúc này. Vui lòng thử lại.",
    });
  } finally {
    await session.close();
  }
});

router.get("/mine", async (req, res) => {
  const session = driver.session();
  const { limit = 20 } = req.query;

  try {
    const result = await session.run(
      `
      MATCH (author:User {email: $email})-[:POSTED]->(post:Post)
      OPTIONAL MATCH (post)<-[like:LIKED]-(:User)
      WITH post, author, COUNT(DISTINCT like) AS likeCount
      ORDER BY post.createdAt DESC
      LIMIT toInteger($limit)
      RETURN ${postProjection("post")} AS post,
             ${userProjection("author")} AS author,
             likeCount
      `,
      { email: req.user.email, limit: Number(limit) }
    );

    const posts = result.records.map((record) => ({
      post: record.get("post"),
      author: record.get("author"),
      likeCount: toPlainNumber(record.get("likeCount")),
      liked: false,
      reasons: [
        {
          type: "author",
          friends: [record.get("author")],
        },
      ],
    }));

    res.json(posts);
  } catch (error) {
    console.error("Failed to query my posts:", error);
    res.status(500).json({
      error: "Không thể tải danh sách bài viết cá nhân.",
    });
  } finally {
    await session.close();
  }
});

router.get("/feed", async (req, res) => {
  const session = driver.session();
  const { limit = 30 } = req.query;

  try {
    const friendPostsResult = await session.run(
      `
      MATCH (me:User {email: $email})-[:FRIEND_WITH]->(author:User)-[:POSTED]->(post:Post)
      WHERE coalesce(post.visibility, "friends") IN ["friends", "public"]
      OPTIONAL MATCH (post)<-[:LIKED]-(liker:User)
      OPTIONAL MATCH (me)-[:FRIEND_WITH]->(friendLike:User)-[:LIKED]->(post)
      OPTIONAL MATCH (me)-[myLike:LIKED]->(post)
      WITH post,
           author,
           collect(DISTINCT liker) AS allLikers,
           collect(DISTINCT friendLike) AS friendLikers,
           COUNT(myLike) > 0 AS liked
      RETURN {
        post: ${postProjection("post")},
        author: ${userProjection("author")},
        likeCount: size(allLikers),
        liked: liked,
        friendHighlights: [friend IN friendLikers | ${userProjection("friend")}],
        reasons: [{
          type: "friend_post",
          friends: [${userProjection("author")}]
        }]
      } AS item,
      post.createdAt AS createdAt
      ORDER BY createdAt DESC
      LIMIT toInteger($limit)
      `,
      { email: req.user.email, limit: Number(limit) * 2 }
    );

    const likedPostsResult = await session.run(
      `
      MATCH (me:User {email: $email})-[:FRIEND_WITH]->(friend:User)-[:LIKED]->(post:Post)<-[:POSTED]-(author:User)
      WHERE author.email <> $email
      OPTIONAL MATCH (post)<-[:LIKED]-(liker:User)
      OPTIONAL MATCH (author)-[:FRIEND_WITH]->(mutual:User)-[:FRIEND_WITH]->(me)
      OPTIONAL MATCH (me)-[myLike:LIKED]->(post)
      WITH post,
           author,
           collect(DISTINCT liker) AS allLikers,
           collect(DISTINCT friend) AS recommendingFriends,
           collect(DISTINCT mutual) AS mutuals,
           COUNT(myLike) > 0 AS liked
      RETURN {
        post: ${postProjection("post")},
        author: ${userProjection("author")},
        likeCount: size(allLikers),
        liked: liked,
        friendHighlights: [friend IN recommendingFriends | ${userProjection("friend")}],
        mutualFriends: [mutual IN mutuals | ${userProjection("mutual")}],
        mutualCount: size(mutuals),
        reasons: [{
          type: "friend_like",
          friends: [friend IN recommendingFriends | ${userProjection("friend")}],
          friendCount: size(recommendingFriends)
        }]
      } AS item,
      post.createdAt AS createdAt
      ORDER BY createdAt DESC
      LIMIT toInteger($limit)
      `,
      { email: req.user.email, limit: Number(limit) * 2 }
    );

    const combined = mergeFeedItems([
      ...mapRecords(friendPostsResult.records, "item"),
      ...mapRecords(likedPostsResult.records, "item"),
    ]);

    const feed = combined
      .map((item) => ({
        ...item,
        likeCount: toPlainNumber(item.likeCount),
        mutualCount: toPlainNumber(item.mutualCount),
      }))
      .sort((a, b) => computeScore(b) - computeScore(a))
      .slice(0, Number(limit));

    res.json(feed);
  } catch (error) {
    console.error("Failed to load feed:", error);
    res.status(500).json({
      error: "Không thể tải bản tin kết nối ngay lúc này.",
    });
  } finally {
    await session.close();
  }
});

router.post("/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const action = req.body?.action === "unlike" ? "unlike" : "like";

  const session = driver.session();
  try {
    const cypher =
      action === "like"
        ? `
        MATCH (me:User {email: $email})
        MATCH (post:Post)
        WHERE post.id = $postId OR elementId(post) = $postId
        MERGE (me)-[like:LIKED]->(post)
        ON CREATE SET like.createdAt = datetime()
        WITH post, like
        OPTIONAL MATCH (post)<-[likes:LIKED]-(:User)
        RETURN ${postProjection("post")} AS post, COUNT(likes) AS likeCount, true AS liked
        `
        : `
        MATCH (me:User {email: $email})-[like:LIKED]->(post:Post)
        WHERE post.id = $postId OR elementId(post) = $postId
        DELETE like
        WITH post
        OPTIONAL MATCH (post)<-[likes:LIKED]-(:User)
        RETURN ${postProjection("post")} AS post, COUNT(likes) AS likeCount, false AS liked
        `;

    const result = await session.run(cypher, {
      email: req.user.email,
      postId,
    });

    if (!result.records.length) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy bài viết để cập nhật lượt thích." });
    }

    const record = result.records[0];
    res.json({
      success: true,
      post: record.get("post"),
      likeCount: toPlainNumber(record.get("likeCount")),
      liked: record.get("liked"),
    });
  } catch (error) {
    console.error("Failed to toggle like:", error);
    res.status(500).json({
      error: "Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.",
    });
  } finally {
    await session.close();
  }
});

export default router;
