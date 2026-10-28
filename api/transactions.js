import { createClient } from "redis"
import { NextResponse } from "next/server"

// יצירת חיבור בעזרת מחרוזת ה-REDIS_URL הבלעדית
let client;

async function getRedisClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL
    });
    client.on("error", (err) => console.error("Redis Client Error", err));
    await client.connect();
  }
  return client;
}

export async function GET() {
  try {
    const redis = await getRedisClient();
    const value = await redis.get("myKey");
    return NextResponse.json({ value });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
