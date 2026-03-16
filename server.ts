import express from 'express';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });

  app.use(express.json());
  
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  let db: any;
  try {
    console.log('Initializing database...');
    const dbModule = await import('./src/lib/db.ts');
    db = dbModule.default;
    console.log('Database initialized');
  } catch (err) {
    console.error('DB Init Error:', err);
    db = { prepare: () => ({ run: () => ({}), get: () => ({}), all: () => [] }), exec: () => ({}) };
  }

  // --- Auth API ---
  app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
      const hash = await bcrypt.hash(password, 12);
      const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
      const info = stmt.run(username, hash);
      res.json({ 
        id: info.lastInsertRowid, 
        username, 
        minBudget: 15000,
        calendarStartDate: null,
        debtStartDate: null,
        targetMonths: 24,
        avatarUrl: null
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
      debtStartDate: user.debt_start_date,
      targetMonths: user.target_months || 24,
      avatarUrl: user.avatar_url
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

  app.put('/api/users/:id/target-months', (req, res) => {
    const { targetMonths } = req.body;
    const stmt = db.prepare('UPDATE users SET target_months = ? WHERE id = ?');
    stmt.run(targetMonths, req.params.id);
    res.json({ success: true });
  });

  app.put('/api/users/:id/avatar', (req, res) => {
    const { avatarUrl } = req.body;
    const stmt = db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?');
    stmt.run(avatarUrl, req.params.id);
    res.json({ success: true });
  });

  app.get('/api/auth/google/url', (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google Client ID не настроен. Пожалуйста, добавьте GOOGLE_CLIENT_ID в переменные окружения.' });
    }
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/auth/callback`;
    
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    // In a real app, exchange code for token. For demo, we'll mock it if no client secret.
    let userData = null;
    
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      userData = {
        id: 'mock-google-id',
        name: 'Google User',
        email: 'user@example.com',
        picture: 'https://ui-avatars.com/api/?name=Google+User&background=random'
      };
    } else {
      try {
        const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            code: code as string,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        });
        const tokenData = await tokenRes.json();
        
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        userData = await userRes.json();
      } catch (err) {
        console.error('OAuth error', err);
      }
    }

    if (userData) {
      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(userData.id) as any;
      if (!user) {
        const stmt = db.prepare('INSERT INTO users (username, password_hash, google_id, avatar_url) VALUES (?, ?, ?, ?)');
        const info = stmt.run(userData.name || userData.email, 'oauth', userData.id, userData.picture);
        user = { id: info.lastInsertRowid, username: userData.name || userData.email, min_budget: 15000, avatar_url: userData.picture, target_months: 24 };
      }
      
      const userPayload = JSON.stringify({
        id: user.id,
        username: user.username,
        minBudget: user.min_budget || 15000,
        calendarStartDate: user.calendar_start_date,
        debtStartDate: user.debt_start_date,
        targetMonths: user.target_months || 24,
        avatarUrl: user.avatar_url || userData.picture
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${userPayload} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } else {
      res.send('Authentication failed');
    }
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
    const stmt = db.prepare('INSERT OR REPLACE INTO incomes (id, user_id, name, amount, dates) VALUES (?, ?, ?, ?, ?)');
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
    const stmt = db.prepare('INSERT OR REPLACE INTO debts (id, user_id, name, amount, rate, type, mandatoryPayment, remainingMonths, paymentDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
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
    const stmt = db.prepare('INSERT OR REPLACE INTO bills (id, user_id, name, amount, dueDate) VALUES (?, ?, ?, ?, ?)');
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

  // --- Payments API ---
  app.get('/api/payments', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const stmt = db.prepare('SELECT id, user_id as userId, item_id as itemId, item_type as itemType, amount, date FROM payments WHERE user_id = ?');
    const payments = stmt.all(userId);
    res.json(payments);
  });

  app.post('/api/payments', (req, res) => {
    const { id, userId, itemId, itemType, amount, date } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO payments (id, user_id, item_id, item_type, amount, date) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, userId, itemId, itemType, amount, date);
    res.json({ success: true });
  });

  app.put('/api/payments/:id', (req, res) => {
    const { amount, date } = req.body;
    const stmt = db.prepare('UPDATE payments SET amount = ?, date = ? WHERE id = ?');
    stmt.run(amount, date, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/payments/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM payments WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // --- Item Shifts API ---
  app.get('/api/item-shifts', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const stmt = db.prepare('SELECT id, user_id as userId, item_id as itemId, item_type as itemType, original_date as originalDate, new_date as newDate FROM item_shifts WHERE user_id = ?');
    const shifts = stmt.all(userId);
    res.json(shifts);
  });

  app.post('/api/item-shifts', (req, res) => {
    const { id, userId, itemId, itemType, originalDate, newDate } = req.body;
    
    // Check if a shift already exists for this item and original date
    const checkStmt = db.prepare('SELECT id FROM item_shifts WHERE user_id = ? AND item_id = ? AND item_type = ? AND original_date = ?');
    const existing = checkStmt.get(userId, itemId, itemType, originalDate) as any;
    
    if (newDate === originalDate) {
      if (existing) {
        const deleteStmt = db.prepare('DELETE FROM item_shifts WHERE id = ?');
        deleteStmt.run(existing.id);
      }
      return res.json({ success: true });
    }

    if (existing) {
      // Update existing shift
      const updateStmt = db.prepare('UPDATE item_shifts SET new_date = ? WHERE id = ?');
      updateStmt.run(newDate, existing.id);
      res.json({ success: true, id: existing.id });
    } else {
      // Create new shift
      const stmt = db.prepare('INSERT OR REPLACE INTO item_shifts (id, user_id, item_id, item_type, original_date, new_date) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run(id, userId, itemId, itemType, originalDate, newDate);
      res.json({ success: true, id });
    }
  });

  app.delete('/api/item-shifts/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM item_shifts WHERE id = ?');
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

}

startServer().catch(err => {
  console.error('Unhandled error during server startup:', err);
});
