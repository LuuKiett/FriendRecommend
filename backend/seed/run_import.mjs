import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load biến môi trường từ backend/.env để kết nối Neo4j Aura
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { default: driver } = await import("../neo4j.js");

const BASE_URL =
  process.env.SEED_BASE_URL ||
  "https://raw.githubusercontent.com/LuuKiett/FriendRecommend/main/backend/seed/data";

const IMPORT_FILE = path.resolve(__dirname, "import.cypher");

async function runImport() {
  const session = driver.session();
  try {
    const file = readFileSync(IMPORT_FILE, "utf-8");
    const statements = file
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n")
      .split(";")
      .map((stmt) => stmt.trim())
      .filter(Boolean);

    await session.run(":param baseUrl => $baseUrl", { baseUrl: BASE_URL });

    for (const query of statements) {
      console.log("Running:", query.slice(0, 80), "...");
      await session.run(query);
    }

    console.log("Import completed!");
  } finally {
    await session.close();
    await driver.close();
  }
}

runImport().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
