import { Redis } from '@upstash/redis';

// אתחול Redis באופן אוטומטי מתוך משתני הסביבה של Vercel / Upstash
const redis = Redis.fromEnv();
const STORAGE_KEY = 'family_transactions';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. קריאת כל התנועות
    if (req.method === 'GET') {
      const data = await redis.get(STORAGE_KEY);
      const transactions = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];
      return res.status(200).json(transactions);
    }

    // 2. הוספת תנועה חדשה
    if (req.method === 'POST') {
      const newTransaction = req.body;
      if (!newTransaction || !newTransaction.amount || !newTransaction.title) {
        return res.status(400).json({ error: 'חסרים נתונים חובה (תיאור או סכום)' });
      }

      const rawData = await redis.get(STORAGE_KEY);
      let transactions = rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : [];

      newTransaction.id = Date.now().toString();
      newTransaction.createdAt = new Date().toISOString();

      transactions.unshift(newTransaction);
      await redis.set(STORAGE_KEY, JSON.stringify(transactions));

      return res.status(201).json(newTransaction);
    }

    // 3. מחיקת תנועה
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'מזהה תנועה חסר' });
      }

      const rawData = await redis.get(STORAGE_KEY);
      let transactions = rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : [];
      transactions = transactions.filter((t) => t.id !== id);
      
      await redis.set(STORAGE_KEY, JSON.stringify(transactions));

      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database Error:', error);
    return res.status(500).json({ error: 'שגיאה בתקשורת מול מסד הנתונים', details: error.message });
  }
}
