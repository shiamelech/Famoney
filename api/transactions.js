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
      
      // הוספת התנועה החדשה לסוף הרשימה ב-Redis
      await client.rPush("transactions_list", JSON.stringify(body));
      
      return res.status(200).json({ success: true, data: body });
    } 
    
    if (req.method === 'GET') {
      // שליפת כל התנועות שנשמרו ברשימה
      const rawData = await client.lRange("transactions_list", 0, -1);
      const transactions = rawData.map(item => JSON.parse(item));
      
      // מחזירים מערך של תנועות כפי שהאפליקציה מצפה לקבל
      return res.status(200).json(transactions);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
