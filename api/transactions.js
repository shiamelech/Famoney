import { createClient } from "redis";

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

export default async function handler(req, res) {
  try {
    const client = await getRedisClient();

    if (req.method === 'POST') {
      const body = req.body;
      await client.set("latest_transaction", JSON.stringify(body));
      return res.status(200).json({ success: true, data: body });
    } 
    
    if (req.method === 'GET') {
      const data = await client.get("latest_transaction");
      return res.status(200).json({ value: data ? JSON.parse(data) : null });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
