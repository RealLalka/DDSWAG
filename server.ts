import express from 'express';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcrypt';
import db from './src/lib/db.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth API ---
  app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
      const hash = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
      const info = stmt.run(username, hash);
      res.json({ 
        id: info.lastInsertRowid, 
        username, 
        minBudget: 15000,
        calendarStartDate: null,
        debtStartDate: null
      });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Username already exists' });
      } else {
        res.status(500).json({ error: 'Database error' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as any;

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ 
      id: user.id, 
      username: user.username, 
      minBudget: user.min_budget || 15000,
      calendarStartDate: user.calendar_start_date,
      debtStartDate: user.debt_start_date
    });
  });

  app.put('/api/users/:id/min-budget', (req, res) => {
    const { minBudget } = req.body;
    const stmt = db.prepare('UPDATE users SET min_budget = ? WHERE id = ?');
    stmt.run(minBudget, req.params.id);
    res.json({ success: true });
  });

  app.put('/api/users/:id/settings', (req, res) => {
    const { calendarStartDate, debtStartDate } = req.body;
    const stmt = db.prepare('UPDATE users SET calendar_start_date = ?, debt_start_date = ? WHERE id = ?');
    stmt.run(calendarStartDate || null, debtStartDate || null, req.params.id);
    res.json({ success: true });
  });

  // --- Incomes API ---
  app.get('/api/incomes', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const stmt = db.prepare('SELECT * FROM incomes WHERE user_id = ?');
    const incomes = stmt.all(userId).map((inc: any) => ({
      ...inc,
      dates: JSON.parse(inc.dates)
    }));
    res.json(incomes);
  });

  app.post('/api/incomes', (req, res) => {
    const { id, userId, name, amount, dates } = req.body;
    const stmt = db.prepare('INSERT INTO incomes (id, user_id, name, amount, dates) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, userId, name, amount, JSON.stringify(dates));
    res.json({ success: true });
  });

  app.put('/api/incomes/:id', (req, res) => {
    const { name, amount, dates } = req.body;
    const stmt = db.prepare('UPDATE incomes SET name = ?, amount = ?, dates = ? WHERE id = ?');
    stmt.run(name, amount, JSON.stringify(dates), req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/incomes/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM incomes WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // --- Debts API ---
  app.get('/api/debts', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const stmt = db.prepare('SELECT * FROM debts WHERE user_id = ?');
    const debts = stmt.all(userId);
    res.json(debts);
  });

  app.post('/api/debts', (req, res) => {
    const { id, userId, name, amount, rate, type, mandatoryPayment, remainingMonths, paymentDate } = req.body;
    const stmt = db.prepare('INSERT INTO debts (id, user_id, name, amount, rate, type, mandatoryPayment, remainingMonths, paymentDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, userId, name, amount, rate, type, mandatoryPayment, remainingMonths, paymentDate || 1);
    res.json({ success: true });
  });

  app.put('/api/debts/:id', (req, res) => {
    const { name, amount, rate, type, mandatoryPayment, remainingMonths, paymentDate } = req.body;
    const stmt = db.prepare('UPDATE debts SET name = ?, amount = ?, rate = ?, type = ?, mandatoryPayment = ?, remainingMonths = ?, paymentDate = ? WHERE id = ?');
    stmt.run(name, amount, rate, type, mandatoryPayment, remainingMonths, paymentDate || 1, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/debts/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM debts WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // --- Bills API ---
  app.get('/api/bills', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const stmt = db.prepare('SELECT * FROM bills WHERE user_id = ?');
    const bills = stmt.all(userId);
    res.json(bills);
  });

  app.post('/api/bills', (req, res) => {
    const { id, userId, name, amount, dueDate } = req.body;
    const stmt = db.prepare('INSERT INTO bills (id, user_id, name, amount, dueDate) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, userId, name, amount, dueDate);
    res.json({ success: true });
  });

  app.put('/api/bills/:id', (req, res) => {
    const { name, amount, dueDate } = req.body;
    const stmt = db.prepare('UPDATE bills SET name = ?, amount = ?, dueDate = ? WHERE id = ?');
    stmt.run(name, amount, dueDate, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/bills/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM bills WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
