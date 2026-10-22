import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // הגדרת כותרות CORS במידת הצורך
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const STORAGE_KEY = 'family_transactions';

  try {
    // 1. קבלת כל התנועות
    if (req.method === 'GET') {
      const transactions = (await kv.get(STORAGE_KEY)) || [];
      return res.status(200).json(transactions);
    }

    // 2. הוספת תנועה חדשה
    if (req.method === 'POST') {
      const newTransaction = req.body;
      if (!newTransaction || !newTransaction.amount || !newTransaction.title) {
        return res.status(400).json({ error: 'חסרים נתונים חובה' });
      }

      const transactions = (await kv.get(STORAGE_KEY)) || [];
      newTransaction.id = Date.now().toString();
      newTransaction.createdAt = new Date().toISOString();

      transactions.unshift(newTransaction);
      await kv.set(STORAGE_KEY, transactions);

      return res.status(201).json(newTransaction);
    }

    // 3. עדכון תנועה קיימת
    if (req.method === 'PUT') {
      const updatedTransaction = req.body;
      if (!updatedTransaction || !updatedTransaction.id) {
        return res.status(400).json({ error: 'מזהה תנועה חסר' });
      }

      let transactions = (await kv.get(STORAGE_KEY)) || [];
      transactions = transactions.map((t) =>
        t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } : t
      );
      await kv.set(STORAGE_KEY, transactions);

      return res.status(200).json(updatedTransaction);
    }

    // 4. מחיקת תנועה
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'מזהה תנועה חסר' });
      }

      let transactions = (await kv.get(STORAGE_KEY)) || [];
      transactions = transactions.filter((t) => t.id !== id);
      await kv.set(STORAGE_KEY, transactions);

      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'שגיאת שרת פנימית', details: error.message });
  }
}
