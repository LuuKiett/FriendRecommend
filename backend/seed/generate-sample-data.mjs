import { randomUUID } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, "data");

const config = {
  userCount: Number(process.env.SEED_USERS) || 4000,
  groupCount: Number(process.env.SEED_GROUPS) || 180,
  postPerUser: {
    min: Number(process.env.SEED_POSTS_MIN) || 1,
    max: Number(process.env.SEED_POSTS_MAX) || 6,
  },
  friendRange: {
    min: Number(process.env.SEED_FRIENDS_MIN) || 24,
    max: Number(process.env.SEED_FRIENDS_MAX) || 58,
  },
  friendRequests: Number(process.env.SEED_REQUESTS) || 3200,
  dismissals: Number(process.env.SEED_DISMISSALS) || 1400,
  groupMemberships: {
    min: Number(process.env.SEED_GROUPS_MIN) || 2,
    max: Number(process.env.SEED_GROUPS_MAX) || 6,
  },
  maxLikesPerPost: Number(process.env.SEED_LIKES_MAX) || 42,
  timezoneOffsetMinutes: Number(process.env.SEED_TZ_OFFSET) || 0,
};

const PASSWORD_HASH =
  "$2b$10$txKkHHwTyJJvlGca6mny/OXZOM7iVW0GONrOSqe4x7hkIkdAeZrhO"; // "Password123!"

const firstNames = [
  "An",
  "Bình",
  "Chi",
  "Duy",
  "Dung",
  "Giang",
  "Hải",
  "Hạnh",
  "Hùng",
  "Khánh",
  "Lan",
  "Linh",
  "Minh",
  "My",
  "Nam",
  "Ngọc",
  "Phát",
  "Phương",
  "Quân",
  "Quỳnh",
  "Sơn",
  "Thảo",
  "Thành",
  "Trang",
  "Trung",
  "Tuấn",
  "Tú",
  "Vy",
  "Yến",
  "Xuân",
];

const lastNames = [
  "Nguyễn",
  "Trần",
  "Lê",
  "Phạm",
  "Hoàng",
  "Huỳnh",
  "Phan",
  "Vũ",
  "Võ",
  "Đặng",
  "Bùi",
  "Đỗ",
  "Hồ",
  "Ngô",
  "Dương",
  "Lý",
];

const cities = [
  "Hà Nội",
  "TP Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Huế",
  "Nha Trang",
  "Vinh",
  "Buôn Ma Thuột",
  "Đà Lạt",
  "Bắc Ninh",
  "Quy Nhơn",
  "Vũng Tàu",
  "Thái Nguyên",
  "Biên Hòa",
  "Nam Định",
  "Hạ Long",
  "Cà Mau",
  "Pleiku",
  "Thanh Hóa",
];

const companies = [
  "Viettel",
  "FPT Software",
  "VNPT",
  "VNG",
  "MoMo",
  "Grab",
  "Shopee",
  "Be Group",
  "VinAI",
  "Tiki",
  "NashTech",
  "KMS Technology",
  "DEK Technologies",
  "Axon Active",
  "MBBank",
  "Techcombank",
  "TPBank",
  "VPBank",
  "Zalo",
  "TikiNgon",
  "One Mount",
  "Sendo",
  "Haravan",
  "CMC",
  "Vietcombank",
  "Ahamove",
  "GHTK",
  "VNExpress",
  "CAFEX",
];

const roles = [
  "Kỹ sư Dữ liệu",
  "Nhà khoa học dữ liệu",
  "Kỹ sư ML",
  "Chuyên gia BI",
  "Quản lý sản phẩm",
  "Kỹ sư Backend",
  "Kỹ sư Frontend",
  "Kiến trúc sư giải pháp",
  "Chuyên gia Cloud",
  "Chuyên gia An ninh mạng",
  "Kỹ sư DevOps",
  "Data Analyst",
  "Chuyên viên R&D",
  "Product Owner",
  "Chuyên gia QA",
  "Kỹ sư IoT",
  "Kỹ sư AI",
  "Chuyên gia Khai phá dữ liệu",
  "Nhà phân tích kinh doanh",
  "Chuyên viên Tăng trưởng",
];

const interestPool = [
  "machine learning",
  "deep learning",
  "big data",
  "data engineering",
  "distributed systems",
  "graph databases",
  "neo4j",
  "spark",
  "hadoop",
  "kafka",
  "cloud computing",
  "aws",
  "azure",
  "gcp",
  "data visualization",
  "microservices",
  "nosql",
  "python",
  "scala",
  "golang",
  "product design",
  "mobile development",
  "fintech",
  "healthtech",
  "smart city",
  "blockchain",
  "cybersecurity",
  "gen ai",
  "prompt engineering",
  "llmops",
  "data governance",
  "data privacy",
  "etl",
  "data warehousing",
  "real-time analytics",
  "recommendation systems",
  "information retrieval",
  "natural language processing",
  "computer vision",
  "reinforcement learning",
  "edge computing",
];

const postTemplates = [
  "Vừa hoàn thiện bản demo {topic} cho đội dự án, học thêm được khối kiến thức mới!",
  "Chia sẻ chút kinh nghiệm triển khai pipeline {topic} quy mô lớn, anh em ai quan tâm thì hỏi nhé.",
  "Tối nay có buổi thảo luận về {topic} tại {city}, ai rảnh join cùng mình nhen!",
  "Đang tối ưu hệ thống {topic} tại {company}, kết quả đầu tiên khá khả quan.",
  "Thử nghiệm mô hình {topic} với bộ dữ liệu hơn 5TB, kết quả vượt kỳ vọng.",
  "Viết xong blog nhỏ về {topic}, hy vọng giúp ích cho cộng đồng.",
  "Team đang tuyển thêm người đam mê {topic} để scaling sản phẩm, ai hứng thú ib nhé!",
  "Triển khai xong dashboard realtime cho {topic}, nhìn metrics chạy sướng mắt.",
  "Tổng hợp vài tài liệu hay về {topic} mà mình đã đọc gần đây.",
  "Một chút suy nghĩ về cách ứng dụng {topic} vào lĩnh vực {domain}.",
];

const postDomains = [
  "logistics",
  "ngân hàng",
  "bán lẻ",
  "chăm sóc sức khỏe",
  "giáo dục",
  "thương mại điện tử",
  "chính phủ số",
  "giao thông thông minh",
  "vận hành doanh nghiệp",
  "marketing cá nhân hóa",
  "sản xuất",
];

const requestMessages = [
  "Chào bạn, mình cũng đang nghiên cứu {topic}. Kết nối trao đổi nha!",
  "Thấy bạn chia sẻ nhiều về {topic}. Mình rất muốn kết nối để học hỏi thêm.",
  "Mình đang xây dựng dự án {topic}. Hy vọng được kết nối cùng bạn.",
  "Hello, bạn có hứng thú với {topic} không? Mình muốn mở rộng network.",
  "Cùng tham gia cộng đồng {topic} cho vui nhé! Kết nối thôi!",
  "Mình có vài câu hỏi về {topic}. Kết bạn để tiện trao đổi nha.",
];

const groupIntros = [
  "Cộng đồng các chuyên gia",
  "Nhóm nghiên cứu chuyên sâu",
  "Câu lạc bộ chia sẻ kinh nghiệm",
  "Diễn đàn thảo luận",
  "Hub kết nối dành cho người đam mê",
  "Liên minh phát triển",
  "Nhóm học tập vượt tốc",
  "Không gian mở cho tín đồ",
];

const groupPurposes = [
  "chia sẻ case study thực tế",
  "tổ chức workshop định kỳ",
  "thảo luận xu hướng mới",
  "kết nối mentor - mentee",
  "xây dựng thư viện tài liệu mở",
  "hỗ trợ tuyển dụng chất lượng",
  "cùng nhau làm side project",
  "giao lưu giữa các doanh nghiệp",
];

const aboutTemplates = [
  "Đam mê {topic} và xây dựng các hệ thống đáp ứng hàng triệu người dùng.",
  "Có hơn {years} năm kinh nghiệm trong lĩnh vực {topic}. Luôn tìm kiếm thử thách mới.",
  "Tập trung khai thác dữ liệu để tạo giá trị thực tế về {topic}.",
  "Hiện đang dẫn dắt đội ngũ phát triển sản phẩm xoay quanh {topic}.",
  "Quan tâm đến việc áp dụng {topic} vào các bài toán quy mô lớn.",
];

const visibilityOptions = [
  { value: "friends", weight: 0.55 },
  { value: "connections", weight: 0.25 },
  { value: "public", weight: 0.2 },
];

const mediaKeywords = [
  "technology",
  "data",
  "analytics",
  "teamwork",
  "innovation",
  "research",
  "coding",
  "startup",
  "network",
  "cloud",
  "infrastructure",
  "machinelearning",
  "city",
  "workspace",
];

const timezoneOffsetMs = config.timezoneOffsetMinutes * 60 * 1000;
const now = new Date(Date.now() - timezoneOffsetMs);

mkdirSync(OUTPUT_DIR, { recursive: true });

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = (array) => array[randomInt(0, array.length - 1)];

const randomSubset = (array, min, max) => {
  if (!array.length) return [];
  const count = randomInt(min, Math.min(max, array.length));
  const pool = array.slice();
  const result = [];
  for (let i = 0; i < count; i += 1) {
    const index = randomInt(0, pool.length - 1);
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
};

const randomPastDate = (maxDaysAgo) => {
  const offsetDays = Math.random() * maxDaysAgo;
  const result = new Date(now.getTime() - offsetDays * 24 * 60 * 60 * 1000);
  return new Date(result.getTime());
};

const randomDateBetween = (start, end) => {
  const startTime = Math.min(start.getTime(), end.getTime());
  const endTime = Math.max(start.getTime(), end.getTime());
  const time = startTime + Math.random() * (endTime - startTime || 1);
  return new Date(time);
};

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);

const weightedPick = (items) => {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = Math.random() * total;
  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) return item.value;
  }
  return items[items.length - 1].value;
};

const pickRandomIds = (ids, target, excludeId) => {
  if (!target) return [];
  const maxSelectable = excludeId ? ids.length - 1 : ids.length;
  const desired = Math.min(target, Math.max(0, maxSelectable));
  const selection = new Set();
  while (selection.size < desired && selection.size < ids.length) {
    const candidate = randomChoice(ids);
    if (candidate === excludeId) continue;
    selection.add(candidate);
  }
  return Array.from(selection);
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value.getTime() + timezoneOffsetMs).toISOString();
};

const writeCsv = (filename, rows, headers) => {
  if (!rows.length) {
    writeFileSync(path.join(OUTPUT_DIR, filename), "", "utf8");
    return;
  }
  const columns = headers || Object.keys(rows[0]);
  const lines = [
    columns.join(","),
    ...rows.map((row) =>
      columns
        .map((column) => {
          let value = row[column];
          if (Array.isArray(value)) {
            value = value.join("|");
          } else if (value instanceof Date) {
            value = formatDate(value);
          } else if (typeof value === "boolean") {
            value = value ? "true" : "false";
          } else if (value === null || typeof value === "undefined") {
            value = "";
          }
          const stringValue = `${value}`;
          return /[",\n]/.test(stringValue)
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(",")
    ),
  ];
  writeFileSync(path.join(OUTPUT_DIR, filename), lines.join("\n"), "utf8");
};

const users = [];
for (let i = 0; i < config.userCount; i += 1) {
  const first = randomChoice(firstNames);
  const last = randomChoice(lastNames);
  const name = `${first} ${last}`;
  const sanitizedEmail =
    slugify(`${first}.${last}`) || `user${i.toString().padStart(4, "0")}`;
  const email = `${sanitizedEmail}${i}@demo.neo4j`;
  const city = randomChoice(cities);
  const role = randomChoice(roles);
  const company = randomChoice(companies);
  const interests = randomSubset(interestPool, 3, 6);
  const createdAt = randomPastDate(920);
  const lastActive = randomDateBetween(createdAt, now);
  const aboutTemplate = randomChoice(aboutTemplates);
  const about = aboutTemplate
    .replace("{topic}", randomChoice(interests))
    .replace("{years}", randomInt(3, 12));

  users.push({
    id: randomUUID(),
    name,
    email,
    password: PASSWORD_HASH,
    city,
    headline: `${role} @ ${company}`,
    workplace: company,
    avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(
      name
    )}`,
    interests,
    about,
    createdAt,
    lastActive,
  });
}

const userById = new Map(users.map((user) => [user.id, user]));
const userIds = users.map((user) => user.id);

const interestIndex = new Map();
for (const user of users) {
  for (const interest of user.interests) {
    if (!interestIndex.has(interest)) {
      interestIndex.set(interest, []);
    }
    interestIndex.get(interest).push(user);
  }
}

const friendships = [];
const friendshipKeys = new Set();
const friendCounts = new Map(userIds.map((id) => [id, 0]));

const ensureFriendship = (id1, id2) => {
  if (id1 === id2) return false;
  const [a, b] = id1 < id2 ? [id1, id2] : [id2, id1];
  const key = `${a}|${b}`;
  if (friendshipKeys.has(key)) return false;
  const userA = userById.get(a);
  const userB = userById.get(b);
  const start = new Date(
    Math.max(userA.createdAt.getTime(), userB.createdAt.getTime())
  );
  const since = randomDateBetween(start, now);
  friendships.push({ userId: a, friendId: b, since });
  friendshipKeys.add(key);
  friendCounts.set(id1, (friendCounts.get(id1) || 0) + 1);
  friendCounts.set(id2, (friendCounts.get(id2) || 0) + 1);
  return true;
};

const baseOffsets = [1, 2, 3, 4, 5];
for (const offset of baseOffsets) {
  for (let i = 0; i < userIds.length; i += 1) {
    const current = userIds[i];
    const target = userIds[(i + offset) % userIds.length];
    ensureFriendship(current, target);
  }
}

const targetFriendCounts = new Map();
for (const id of userIds) {
  const current = friendCounts.get(id) || 0;
  const minTarget = Math.max(current + 4, config.friendRange.min);
  const maxTarget = Math.max(minTarget, config.friendRange.max);
  targetFriendCounts.set(id, randomInt(minTarget, maxTarget));
}

const totalAttempts =
  userIds.length * (config.friendRange.max + config.friendRange.min);
for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
  const source = randomChoice(userIds);
  const target = randomChoice(userIds);
  if (source === target) continue;
  if (
    friendCounts.get(source) >= targetFriendCounts.get(source) &&
    friendCounts.get(target) >= targetFriendCounts.get(target)
  ) {
    continue;
  }
  ensureFriendship(source, target);
}

for (const id of userIds) {
  let guard = 0;
  while (
    friendCounts.get(id) < targetFriendCounts.get(id) &&
    guard < userIds.length * 3
  ) {
    guard += 1;
    const candidate = randomChoice(userIds);
    if (candidate === id) continue;
    if (ensureFriendship(id, candidate)) break;
  }
}

const groups = [];
const groupOwnerships = [];
const memberships = [];
const membershipKeys = new Set();

for (let i = 0; i < config.groupCount; i += 1) {
  const topics = randomSubset(interestPool, 2, 4);
  const name = `${randomChoice(groupIntros)} ${topics[0]
    .split(" ")
    .map(
      (token) => token.charAt(0).toUpperCase() + token.slice(1)
    )
    .join(" ")}`;
  const description = `${name} tập trung ${randomChoice(
    groupPurposes
  )} xoay quanh ${topics.join(", ")}.`;
  const createdAt = randomPastDate(720);
  const group = {
    id: randomUUID(),
    name,
    description,
    topics,
    cover: `https://source.unsplash.com/collection/1163637/960x540?sig=${i}`,
    createdAt,
  };
  groups.push(group);

  const ownerCandidates = topics
    .flatMap((topic) => interestIndex.get(topic) || [])
    .filter(Boolean);
  const owner =
    ownerCandidates.length > 0
      ? ownerCandidates[randomInt(0, ownerCandidates.length - 1)]
      : randomChoice(users);

  groupOwnerships.push({
    groupId: group.id,
    ownerId: owner.id,
    createdAt,
  });

  const membershipKey = `${group.id}|${owner.id}`;
  membershipKeys.add(membershipKey);
  memberships.push({
    groupId: group.id,
    userId: owner.id,
    role: "owner",
    joinedAt: createdAt,
  });
}

for (const user of users) {
  const membershipTarget = randomInt(
    config.groupMemberships.min,
    config.groupMemberships.max
  );
  let joined = 0;
  let attempts = 0;
  while (joined < membershipTarget && attempts < groups.length * 2) {
    attempts += 1;
    const group = randomChoice(groups);
    const key = `${group.id}|${user.id}`;
    if (membershipKeys.has(key)) continue;
    const joinedAt = randomDateBetween(
      new Date(Math.max(group.createdAt.getTime(), user.createdAt.getTime())),
      now
    );

    membershipKeys.add(key);
    memberships.push({
      groupId: group.id,
      userId: user.id,
      role: groupOwnerships.some(
        (ownership) =>
          ownership.groupId === group.id && ownership.ownerId === user.id
      )
        ? "owner"
        : "member",
      joinedAt,
    });
    joined += 1;
  }
}

const posts = [];
const likes = [];

for (const user of users) {
  const postCount = randomInt(config.postPerUser.min, config.postPerUser.max);
  for (let i = 0; i < postCount; i += 1) {
    const mainTopic =
      user.interests[randomInt(0, user.interests.length - 1)] ||
      randomChoice(interestPool);
    const secondaryTopics = randomSubset(
      interestPool.filter((topic) => topic !== mainTopic),
      1,
      3
    );
    const topics = Array.from(new Set([mainTopic, ...secondaryTopics]));
    const template = randomChoice(postTemplates);
    const domain = randomChoice(postDomains);
    const content = `${template
      .replace("{topic}", mainTopic)
      .replace("{city}", user.city)
      .replace("{company}", user.workplace)
      .replace("{domain}", domain)} ${topics
      .slice(0, 3)
      .map((topic) => `#${slugify(topic)}`)
      .join(" ")}`;
    const createdAt = randomDateBetween(user.createdAt, now);
    const useMedia = Math.random() < 0.28;
    const mediaUrl = useMedia
      ? `https://source.unsplash.com/960x540/?${
          mediaKeywords[randomInt(0, mediaKeywords.length - 1)]
        }&sig=${slugify(user.id).slice(0, 10)}${i}`
      : "";
    const visibility = weightedPick(visibilityOptions);

    const post = {
      id: randomUUID(),
      userId: user.id,
      content,
      media: mediaUrl,
      topics,
      visibility,
      createdAt,
    };
    posts.push(post);

    const likeTarget = randomInt(0, config.maxLikesPerPost);
    const likers = pickRandomIds(userIds, likeTarget, null);
    for (const likerId of likers) {
      if (likerId === user.id) continue;
      likes.push({
        userId: likerId,
        postId: post.id,
        createdAt: randomDateBetween(post.createdAt, now),
      });
    }
  }
}

const friendRequests = [];
const requestKeys = new Set();

while (friendRequests.length < config.friendRequests) {
  const senderId = randomChoice(userIds);
  const targetId = randomChoice(userIds);
  if (senderId === targetId) continue;
  const pairKey =
    senderId < targetId
      ? `${senderId}|${targetId}`
      : `${targetId}|${senderId}`;
  if (friendshipKeys.has(pairKey)) continue;
  const directionKey = `${senderId}>${targetId}`;
  if (requestKeys.has(directionKey)) continue;
  requestKeys.add(directionKey);

  const sender = userById.get(senderId);
  const target = userById.get(targetId);
  const createdAt = randomDateBetween(
    new Date(
      Math.max(sender.createdAt.getTime(), target.createdAt.getTime())
    ),
    now
  );

  friendRequests.push({
    id: randomUUID(),
    senderId,
    targetId,
    message: randomChoice(requestMessages).replace(
      "{topic}",
      randomChoice(sender.interests)
    ),
    createdAt,
  });
}

const dismissals = [];
const dismissalKeys = new Set();

while (dismissals.length < config.dismissals) {
  const userId = randomChoice(userIds);
  const targetId = randomChoice(userIds);
  if (userId === targetId) continue;
  const uniqueKey = `${userId}|${targetId}`;
  if (dismissalKeys.has(uniqueKey)) continue;
  const pairKey =
    userId < targetId ? `${userId}|${targetId}` : `${targetId}|${userId}`;
  if (friendshipKeys.has(pairKey)) continue;
  dismissalKeys.add(uniqueKey);

  const user = userById.get(userId);
  const createdAt = randomDateBetween(user.createdAt, now);
  dismissals.push({
    userId,
    targetId,
    createdAt,
  });
}

writeCsv(
  "users.csv",
  users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    city: user.city || "",
    headline: user.headline || "",
    workplace: user.workplace || "",
    avatar: user.avatar || "",
    interests: user.interests,
    about: user.about || "",
    createdAt: user.createdAt,
    lastActive: user.lastActive,
  }))
);

writeCsv(
  "friendships.csv",
  friendships.map((item) => ({
    userId: item.userId,
    friendId: item.friendId,
    since: item.since,
  }))
);

writeCsv(
  "friend_requests.csv",
  friendRequests.map((req) => ({
    id: req.id,
    senderId: req.senderId,
    targetId: req.targetId,
    message: req.message,
    createdAt: req.createdAt,
  }))
);

writeCsv(
  "dismissed.csv",
  dismissals.map((entry) => ({
    userId: entry.userId,
    targetId: entry.targetId,
    createdAt: entry.createdAt,
  }))
);

writeCsv(
  "groups.csv",
  groups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    topics: group.topics,
    cover: group.cover,
    createdAt: group.createdAt,
  }))
);

writeCsv(
  "group_owners.csv",
  groupOwnerships.map((ownership) => ({
    groupId: ownership.groupId,
    ownerId: ownership.ownerId,
    createdAt: ownership.createdAt,
  }))
);

writeCsv(
  "group_memberships.csv",
  memberships.map((membership) => ({
    groupId: membership.groupId,
    userId: membership.userId,
    role: membership.role,
    joinedAt: membership.joinedAt,
  }))
);

writeCsv(
  "posts.csv",
  posts.map((post) => ({
    id: post.id,
    userId: post.userId,
    content: post.content,
    media: post.media,
    topics: post.topics,
    visibility: post.visibility,
    createdAt: post.createdAt,
  }))
);

writeCsv(
  "likes.csv",
  likes.map((like) => ({
    userId: like.userId,
    postId: like.postId,
    createdAt: like.createdAt,
  }))
);

const summary = {
  users: users.length,
  friendships: friendships.length,
  requests: friendRequests.length,
  dismissed: dismissals.length,
  groups: groups.length,
  memberships: memberships.length,
  posts: posts.length,
  likes: likes.length,
};

writeFileSync(
  path.join(OUTPUT_DIR, "summary.json"),
  JSON.stringify(summary, null, 2),
  "utf8"
);

console.log("Sample data generated:", summary);
