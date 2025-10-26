// Set this to the base URL where the CSV files are hosted (e.g. raw GitHub URL)
:param baseUrl => 'https://raw.githubusercontent.com/your-account/FriendRecommend/main/backend/seed/data';

// Optional cleanup if you want a fresh database (uncomment with caution)
// MATCH (n) DETACH DELETE n;

CREATE CONSTRAINT user_email_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.email IS UNIQUE;

CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT group_id_unique IF NOT EXISTS
FOR (g:Group) REQUIRE g.id IS UNIQUE;

CREATE CONSTRAINT post_id_unique IF NOT EXISTS
FOR (p:Post) REQUIRE p.id IS UNIQUE;

CALL db.awaitIndexes();

USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM $baseUrl + '/users.csv' AS row
MERGE (u:User {id: row.id})
SET u.email = row.email,
    u.name = row.name,
    u.password = row.password,
    u.city = CASE row.city WHEN '' THEN NULL ELSE row.city END,
    u.headline = CASE row.headline WHEN '' THEN NULL ELSE row.headline END,
    u.workplace = CASE row.workplace WHEN '' THEN NULL ELSE row.workplace END,
    u.avatar = CASE row.avatar WHEN '' THEN NULL ELSE row.avatar END,
    u.about = CASE row.about WHEN '' THEN NULL ELSE row.about END,
    u.interests = CASE
      WHEN row.interests = '' THEN []
      ELSE [interest IN split(row.interests, '|') WHERE interest <> '']
    END,
    u.createdAt = datetime(row.createdAt),
    u.lastActive = datetime(row.lastActive);

USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM $baseUrl + '/friendships.csv' AS row
MATCH (a:User {id: row.userId})
MATCH (b:User {id: row.friendId})
MERGE (a)-[ab:FRIEND_WITH]->(b)
ON CREATE SET ab.since = datetime(row.since)
MERGE (b)-[ba:FRIEND_WITH]->(a)
ON CREATE SET ba.since = datetime(row.since);

USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM $baseUrl + '/friend_requests.csv' AS row
MATCH (sender:User {id: row.senderId})
MATCH (target:User {id: row.targetId})
MERGE (sender)-[req:REQUESTED {id: row.id}]->(target)
SET req.message = CASE row.message WHEN '' THEN NULL ELSE row.message END,
    req.createdAt = datetime(row.createdAt);

USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM $baseUrl + '/dismissed.csv' AS row
MATCH (u:User {id: row.userId})
MATCH (target:User {id: row.targetId})
MERGE (u)-[dismiss:DISMISSED]->(target)
ON CREATE SET dismiss.createdAt = datetime(row.createdAt);

USING PERIODIC COMMIT 100
LOAD CSV WITH HEADERS FROM $baseUrl + '/groups.csv' AS row
MERGE (g:Group {id: row.id})
SET g.name = row.name,
    g.description = row.description,
    g.cover = CASE row.cover WHEN '' THEN NULL ELSE row.cover END,
    g.topics = CASE
      WHEN row.topics = '' THEN []
      ELSE [topic IN split(row.topics, '|') WHERE topic <> '']
    END,
    g.createdAt = datetime(row.createdAt);

USING PERIODIC COMMIT 100
LOAD CSV WITH HEADERS FROM $baseUrl + '/group_owners.csv' AS row
MATCH (g:Group {id: row.groupId})
MATCH (u:User {id: row.ownerId})
MERGE (u)-[rel:CREATED_GROUP]->(g)
ON CREATE SET rel.createdAt = datetime(row.createdAt);

USING PERIODIC COMMIT 500
LOAD CSV WITH HEADERS FROM $baseUrl + '/group_memberships.csv' AS row
MATCH (g:Group {id: row.groupId})
MATCH (u:User {id: row.userId})
MERGE (u)-[membership:MEMBER_OF]->(g)
SET membership.role = CASE row.role WHEN '' THEN 'member' ELSE row.role END,
    membership.joinedAt = datetime(row.joinedAt);

USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM $baseUrl + '/posts.csv' AS row
MERGE (p:Post {id: row.id})
SET p.content = row.content,
    p.media = CASE row.media WHEN '' THEN NULL ELSE row.media END,
    p.topics = CASE
      WHEN row.topics = '' THEN []
      ELSE [topic IN split(row.topics, '|') WHERE topic <> '']
    END,
    p.visibility = CASE row.visibility WHEN '' THEN 'friends' ELSE row.visibility END,
    p.createdAt = datetime(row.createdAt)
WITH row, p
MATCH (author:User {id: row.userId})
MERGE (author)-[rel:POSTED]->(p)
ON CREATE SET rel.createdAt = p.createdAt;

USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM $baseUrl + '/likes.csv' AS row
MATCH (u:User {id: row.userId})
MATCH (p:Post {id: row.postId})
MERGE (u)-[like:LIKED]->(p)
ON CREATE SET like.createdAt = datetime(row.createdAt);
