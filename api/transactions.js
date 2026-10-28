import { createClient } from "redis"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const body = await request.json();
    
    const client = createClient({
      url: process.env.REDIS_URL
    });
    
    await client.connect();
    
    // שמירת הנתונים ב-Redis (לדוגמה כמפתח כללי או ברשימה)
    await client.set("latest_transaction", JSON.stringify(body));
    
    await client.disconnect();

    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    console.error("Server Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = createClient({
      url: process.env.REDIS_URL
    });
    
    await client.connect();
    const data = await client.get("latest_transaction");
    await client.disconnect();

    return NextResponse.json({ value: data ? JSON.parse(data) : null });
  } catch (error) {
    console.error("Server Read Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
