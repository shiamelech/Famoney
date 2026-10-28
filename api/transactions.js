import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

// יצירת חיבור אוטומטי מבוסס משתני הסביבה UPSTASH_REDIS_REST_URL ו-UPSTASH_REDIS_REST_TOKEN
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export async function GET() {
  try {
    const value = await redis.get("myKey")
    return NextResponse.json({ value })
  } catch (error) {
    console.error("Database Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
