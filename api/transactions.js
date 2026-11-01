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
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const listType = urlObj.searchParams.get('list');
    const redisKey = listType === 'recurring' ? 'recurring_list' : 'transactions_list';

    if (req.method === 'POST') {
      const body = req.body;
      await client.rPush(redisKey, JSON.stringify(body));
      return res.status(200).json({ success: true, data: body });
    } 
    
    if (req.method === 'GET') {
      const rawData = await client.lRange(redisKey, 0, -1);
      const items = rawData.map(item => JSON.parse(item));
      return res.status(200).json(items);
    }

    if (req.method === 'DELETE') {
      // מחיקת פריט ספציפי מהרשימה (לפי אינדקס או מזהה)
      const index = urlObj.searchParams.get('index');
      if (index !== null) {
        const rawData = await client.lRange(redisKey, 0, -1);
        if (rawData[index]) {
          await client.lRem(redisKey, 1, rawData[index]);
          return res.status(200).json({ success: true });
        }
      }
      return res.status(400).json({ error: "Invalid index for deletion" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
