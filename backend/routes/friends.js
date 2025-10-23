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
  avatar: ${alias}.avatar,
  interests: coalesce(${alias}.interests, []),
  about: ${alias}.about
}
`;

const mapRecords = (records, key) => records.map((record) => record.get(key));

const topOccurrences = (values, limit = 3) => {
  const counts = new Map();
  values.forEach((value) => {
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
};

router.get("/list", async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})-[:FRIEND_WITH]->(friend:User)
      RETURN ${userProjection("friend")} AS friend
      ORDER BY friend.name ASC
      `,
      { email: req.user.email }
    );
    res.json(mapRecords(result.records, "friend"));
  } catch (err) {
    console.error("Failed to load friend list:", err);
    res.status(500).json({ error: "Unable to load friend list." });
  } finally {
    await session.close();
  }
});

router.get("/suggestions", async (req, res) => {
  const session = driver.session();
  const {
    limit = 12,
    mutualMin = 0,
    city,
    interest,
    includeInterestMatches = "true",
  } = req.query;
  const includeInterestMatchesBool = includeInterestMatches !== "false";

  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      CALL {
        WITH me
        MATCH (me)-[:FRIEND_WITH]->(:User)-[:FRIEND_WITH]->(candidate:User)
        WHERE candidate.email <> $email
          AND NOT (me)-[:FRIEND_WITH]->(candidate)
          AND NOT (me)-[:REQUESTED]->(candidate)
          AND NOT (candidate)-[:REQUESTED]->(me)
          AND NOT (me)-[:DISMISSED]->(candidate)
        RETURN DISTINCT candidate, "mutual" AS strategy
        UNION
        WITH me
        MATCH (candidate:User)
        WHERE candidate.email <> $email
          AND NOT (me)-[:FRIEND_WITH]->(candidate)
          AND NOT (me)-[:REQUESTED]->(candidate)
          AND NOT (candidate)-[:REQUESTED]->(me)
          AND NOT (me)-[:DISMISSED]->(candidate)
        RETURN DISTINCT candidate, "global" AS strategy
      }
      WITH me, candidate, collect(DISTINCT strategy) AS strategies
      OPTIONAL MATCH (me)-[:FRIEND_WITH]->(mutual:User)-[:FRIEND_WITH]->(candidate)
      WITH me, candidate, strategies, COLLECT(DISTINCT mutual { .name, .email, .avatar }) AS mutualFriends
      WITH me, candidate, strategies, mutualFriends,
           apoc.coll.intersection(coalesce(me.interests, []), coalesce(candidate.interests, [])) AS sharedInterests
      WHERE size(mutualFriends) >= toInteger($mutualMin)
        AND ($city IS NULL OR candidate.city = $city)
        AND (
              $interest IS NULL
              OR $interest IN sharedInterests
              OR $interest IN coalesce(candidate.interests, [])
            )
      WITH candidate, strategies, mutualFriends, sharedInterests,
           CASE WHEN "mutual" IN strategies THEN 0 ELSE 1 END AS priority
      RETURN {
        id: coalesce(candidate.id, elementId(candidate)),
        name: candidate.name,
        email: candidate.email,
        city: candidate.city,
        headline: candidate.headline,
        workplace: candidate.workplace,
        avatar: candidate.avatar,
        interests: coalesce(candidate.interests, []),
        about: candidate.about,
        mutualFriends: mutualFriends,
        sharedInterests: CASE
          WHEN $includeInterestMatches THEN sharedInterests
          ELSE []
        END,
        mutualCount: size(mutualFriends),
        strategies: strategies
      } AS suggestion,
      priority,
      size(sharedInterests) AS interestCount
      ORDER BY priority, suggestion.mutualCount DESC, interestCount DESC, toLower(suggestion.name) ASC
      LIMIT toInteger($limit)
      `,
      {
        email: req.user.email,
        mutualMin: Number(mutualMin),
        city: city ?? null,
        interest: interest ?? null,
        includeInterestMatches: includeInterestMatchesBool,
        limit: Number(limit),
      }
    );

    res.json(mapRecords(result.records, "suggestion"));
  } catch (err) {
    console.error("Failed to load friend suggestions:", err);
    res.status(500).json({ error: "Unable to load friend suggestions." });
  } finally {
    await session.close();
  }
});

router.post("/suggestions/dismiss", async (req, res) => {
  const { targetId } = req.body;
  if (!targetId) {
    return res.status(400).json({ error: "Missing target user id." });
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      MATCH (target:User)
      WHERE target.id = $targetId OR target.email = $targetId
      MERGE (me)-[dismiss:DISMISSED]->(target)
      ON CREATE SET dismiss.createdAt = datetime()
      RETURN target.name AS name
      `,
      { email: req.user.email, targetId }
    );

    if (!result.records.length) {
      return res.status(404).json({ error: "Target user not found." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to dismiss suggestion:", err);
    res.status(500).json({ error: "Unable to dismiss suggestion right now." });
  } finally {
    await session.close();
  }
});

router.get("/search", async (req, res) => {
  const { q = "", limit = 20 } = req.query;
  const term = q.trim();
  if (!term) {
    return res.json([]);
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      WITH toLower($term) AS term
      MATCH (me:User {email: $email})
      MATCH (user:User)
      WHERE me <> user
        AND (
          toLower(user.name) CONTAINS term
          OR (user.city IS NOT NULL AND toLower(user.city) CONTAINS term)
          OR (user.headline IS NOT NULL AND toLower(user.headline) CONTAINS term)
          OR (user.workplace IS NOT NULL AND toLower(user.workplace) CONTAINS term)
          OR ANY(interest IN coalesce(user.interests, []) WHERE toLower(interest) CONTAINS term)
        )
      OPTIONAL MATCH (me)-[friend:FRIEND_WITH]->(user)
      OPTIONAL MATCH (me)-[out:REQUESTED]->(user)
      OPTIONAL MATCH (user)-[incoming:REQUESTED]->(me)
      OPTIONAL MATCH (me)-[:FRIEND_WITH]->(mutual:User)-[:FRIEND_WITH]->(user)
      WITH me, user, friend, out, incoming, COLLECT(DISTINCT mutual) AS mutualNodes
      WITH me, user, friend, out, incoming, mutualNodes,
           apoc.coll.intersection(coalesce(me.interests, []), coalesce(user.interests, [])) AS sharedInterests
      WITH friend, out, incoming, mutualNodes, user, sharedInterests,
           CASE
             WHEN friend IS NOT NULL THEN "friend"
             WHEN incoming IS NOT NULL THEN "incoming"
             WHEN out IS NOT NULL THEN "outgoing"
             ELSE "none"
           END AS status
      WITH {
        id: coalesce(user.id, elementId(user)),
        name: user.name,
        email: user.email,
        city: user.city,
        headline: user.headline,
        workplace: user.workplace,
        avatar: user.avatar,
        interests: coalesce(user.interests, []),
        about: user.about,
        mutualFriends: [mutual IN mutualNodes | { name: mutual.name, email: mutual.email, avatar: mutual.avatar }],
        sharedInterests: sharedInterests,
        mutualCount: size(mutualNodes),
        status: status,
        request: CASE
          WHEN incoming IS NOT NULL THEN {
            id: coalesce(incoming.id, elementId(incoming)),
            direction: "incoming",
            message: incoming.message
          }
          WHEN out IS NOT NULL THEN {
            id: coalesce(out.id, elementId(out)),
            direction: "outgoing",
            message: out.message
          }
          ELSE NULL
        END
      } AS result,
      CASE
        WHEN status = "friend" THEN 0
        WHEN status = "incoming" THEN 1
        WHEN status = "outgoing" THEN 2
        ELSE 3
      END AS statusOrder,
      size(mutualNodes) AS mutualOrder,
      toLower(user.name) AS nameOrder
      RETURN result
      ORDER BY statusOrder, mutualOrder DESC, nameOrder ASC
      LIMIT toInteger($limit)
      `,
      {
        email: req.user.email,
        term: term.toLowerCase(),
        limit: Number(limit),
      }
    );

    res.json(mapRecords(result.records, "result"));
  } catch (err) {
    console.error("Failed to search friends:", err);
    res.status(500).json({ error: "Unable to search right now." });
  } finally {
    await session.close();
  }
});

router.get("/requests", async (req, res) => {
  const session = driver.session();
  try {
    const incomingResult = await session.run(
      `
      MATCH (sender:User)-[req:REQUESTED]->(me:User {email: $email})
      RETURN {
        id: coalesce(req.id, elementId(req)),
        createdAt: CASE WHEN req.createdAt IS NULL THEN null ELSE toString(req.createdAt) END,
        message: req.message,
        user: ${userProjection("sender")}
      } AS request
      ORDER BY req.createdAt DESC
      `,
      { email: req.user.email }
    );

    const outgoingResult = await session.run(
      `
      MATCH (me:User {email: $email})-[req:REQUESTED]->(target:User)
      RETURN {
        id: coalesce(req.id, elementId(req)),
        createdAt: CASE WHEN req.createdAt IS NULL THEN null ELSE toString(req.createdAt) END,
        message: req.message,
        user: ${userProjection("target")}
      } AS request
      ORDER BY req.createdAt DESC
      `,
      { email: req.user.email }
    );

    res.json({
      incoming: mapRecords(incomingResult.records, "request"),
      outgoing: mapRecords(outgoingResult.records, "request"),
    });
  } catch (err) {
    console.error("Failed to load friend requests:", err);
    res.status(500).json({ error: "Unable to load friend requests." });
  } finally {
    await session.close();
  }
});

router.post("/requests", async (req, res) => {
  const { targetId, message } = req.body;
  if (!targetId) {
    return res.status(400).json({ error: "Missing target user." });
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      MATCH (target:User)
      WHERE target.id = $targetId OR target.email = $targetId
      OPTIONAL MATCH (me)-[friend:FRIEND_WITH]->(target)
      OPTIONAL MATCH (me)-[out:REQUESTED]->(target)
      OPTIONAL MATCH (target)-[incoming:REQUESTED]->(me)
      RETURN me, target, friend, out, incoming
      `,
      { email: req.user.email, targetId }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Target user not found." });
    }

    const record = result.records[0];
    const meNode = record.get("me");
    const targetNode = record.get("target");
    const friendRel = record.get("friend");
    const out = record.get("out");
    const incoming = record.get("incoming");

    if (!targetNode) {
      return res.status(404).json({ error: "Target user not found." });
    }

    if (meNode.elementId === targetNode.elementId) {
      return res
        .status(400)
        .json({ error: "You cannot send a request to yourself." });
    }

    if (friendRel) {
      return res
        .status(409)
        .json({ error: "You are already connected with this user." });
    }

    if (incoming) {
      const incomingId =
        incoming.properties?.id ||
        incoming.elementId ||
        incoming.identity?.toString();
      await session.executeWrite(async (tx) => {
        await tx.run(
          `
          MATCH (me:User {email: $email})<-[req:REQUESTED]-(other:User)
          WHERE req.id = $requestId OR elementId(req) = $requestId
          DELETE req
          MERGE (me)-[:FRIEND_WITH]->(other)
          MERGE (other)-[:FRIEND_WITH]->(me)
          `,
          {
            email: req.user.email,
            requestId: incomingId,
          }
        );
      });
      return res.json({ success: true, status: "connected" });
    }

    if (out) {
      return res.status(200).json({ success: true, status: "pending" });
    }

    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        MATCH (me:User {email: $email})
        MATCH (target:User)
        WHERE target.id = $targetId OR target.email = $targetId
        MERGE (me)-[req:REQUESTED]->(target)
        ON CREATE SET req.id = $id,
                      req.createdAt = datetime(),
                      req.message = $message
        `,
        {
          email: req.user.email,
          targetId,
          id: randomUUID(),
          message: message ?? null,
        }
      );
    });

    res.json({ success: true, status: "pending" });
  } catch (err) {
    console.error("Failed to send friend request:", err);
    res.status(500).json({ error: "Unable to send friend request." });
  } finally {
    await session.close();
  }
});

router.patch("/requests/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;
  if (!["accept", "reject"].includes(action)) {
    return res.status(400).json({ error: "Unsupported action." });
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (sender:User)-[req:REQUESTED]->(me:User {email: $email})
      WHERE req.id = $requestId OR elementId(req) = $requestId
      RETURN req, ${userProjection("sender")} AS sender
      `,
      { email: req.user.email, requestId }
    );

    if (!result.records.length) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (action === "accept") {
      await session.executeWrite(async (tx) => {
        await tx.run(
          `
          MATCH (sender:User)-[req:REQUESTED]->(me:User {email: $email})
          WHERE req.id = $requestId OR elementId(req) = $requestId
          DELETE req
          MERGE (me)-[:FRIEND_WITH]->(sender)
          MERGE (sender)-[:FRIEND_WITH]->(me)
          `,
          { email: req.user.email, requestId }
        );
      });
      return res.json({ success: true, status: "connected" });
    }

    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        MATCH (sender:User)-[req:REQUESTED]->(me:User {email: $email})
        WHERE req.id = $requestId OR elementId(req) = $requestId
        DELETE req
        MERGE (me)-[dismiss:DISMISSED]->(sender)
        ON CREATE SET dismiss.createdAt = datetime()
        `,
        { email: req.user.email, requestId }
      );
    });
    res.json({ success: true, status: "declined" });
  } catch (err) {
    console.error("Failed to process friend request:", err);
    res.status(500).json({ error: "Unable to process friend request." });
  } finally {
    await session.close();
  }
});

router.delete("/requests/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})-[req:REQUESTED]->(:User)
      WHERE req.id = $requestId OR elementId(req) = $requestId
      WITH req
      DELETE req
      RETURN COUNT(*) AS deleted
      `,
      { email: req.user.email, requestId }
    );

    if (!result.records.length || result.records[0].get("deleted").toInt() === 0) {
      return res.status(404).json({ error: "Request not found." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to cancel friend request:", err);
    res.status(500).json({ error: "Unable to cancel friend request." });
  } finally {
    await session.close();
  }
});

router.get("/insights", async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {email: $email})
      OPTIONAL MATCH (me)-[:FRIEND_WITH]->(friend:User)
      WITH me, collect(friend) AS friends, count(DISTINCT friend) AS friendCount

      OPTIONAL MATCH (sender:User)-[:REQUESTED]->(me)
      WITH me, friends, friendCount, count(DISTINCT sender) AS incomingCount

      OPTIONAL MATCH (me)-[:REQUESTED]->(target:User)
      WITH me, friends, friendCount, incomingCount, count(DISTINCT target) AS outgoingCount

      OPTIONAL MATCH (me)-[:FRIEND_WITH]->(:User)-[:FRIEND_WITH]->(candidate:User)
      WHERE candidate.email <> me.email
        AND NOT (me)-[:FRIEND_WITH]->(candidate)
        AND NOT (me)-[:REQUESTED]->(candidate)
        AND NOT (candidate)-[:REQUESTED]->(me)
        AND NOT (me)-[:DISMISSED]->(candidate)
      WITH me, friends, friendCount, incomingCount, outgoingCount, count(DISTINCT candidate) AS suggestionCount

      RETURN friendCount,
             incomingCount,
             outgoingCount,
             suggestionCount,
             [friend IN friends WHERE friend.city IS NOT NULL | friend.city] AS friendCities,
             [friend IN friends | coalesce(friend.interests, [])] AS friendInterests
      `,
      { email: req.user.email }
    );

    if (!result.records.length) {
      return res.json({
        friendCount: 0,
        incomingCount: 0,
        outgoingCount: 0,
        suggestionCount: 0,
        topCities: [],
        topInterests: [],
      });
    }

    const record = result.records[0];
    const friendCount = record.get("friendCount").toInt();
    const incomingCount = record.get("incomingCount").toInt();
    const outgoingCount = record.get("outgoingCount").toInt();
    const suggestionCount = record.get("suggestionCount").toInt();
    const friendCities = record.get("friendCities") || [];
    const friendInterests = record.get("friendInterests") || [];

    const flatInterests = friendInterests
      .reduce((all, arr) => all.concat(arr || []), [])
      .filter(Boolean);

    res.json({
      friendCount,
      incomingCount,
      outgoingCount,
      suggestionCount,
      topCities: topOccurrences(friendCities, 3),
      topInterests: topOccurrences(flatInterests, 3),
    });
  } catch (err) {
    console.error("Failed to load network insights:", err);
    res.status(500).json({ error: "Unable to load network insights." });
  } finally {
    await session.close();
  }
});

export default router;
