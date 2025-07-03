const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// PostgreSQL config — wpisz swój connection string z Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// LOGIN endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Nieprawidłowy użytkownik lub hasło' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Nieprawidłowy użytkownik lub hasło' });
    }

    res.json({
      success: true,
      character: user.character_data,
      username: user.username,
      role: user.role, // admin lub user
      organizationId: user.organization_id, // ID organizacji
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// GET members of organization (admin i user widzą tylko swoją organizację)
app.get('/members', async (req, res) => {
  // oczekujemy query param: ?organizationId=xxx
  const { organizationId } = req.query;
  if (!organizationId) {
    return res.status(400).json({ success: false, message: 'Brak ID organizacji' });
  }

  try {
    const result = await pool.query('SELECT * FROM members WHERE organization_id = $1 ORDER BY created_at DESC', [organizationId]);
    res.json({ success: true, members: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// POST add member to organization (tylko admin lub user może dodawać w swojej organizacji, max 30)
app.post('/members', async (req, res) => {
  const { name, role, organizationId, requesterRole } = req.body;

  if (!name || !organizationId || !requesterRole) {
    return res.status(400).json({ success: false, message: 'Brak wymaganych danych' });
  }

  if (!['admin', 'user'].includes(requesterRole)) {
    return res.status(403).json({ success: false, message: 'Brak uprawnień' });
  }

  try {
    // Sprawdź liczbe członków w organizacji
    const countResult = await pool.query('SELECT COUNT(*) FROM members WHERE organization_id = $1', [organizationId]);
    const count = parseInt(countResult.rows[0].count, 10);

    if (count >= 30) {
      return res.status(403).json({ success: false, message: 'Limit członków organizacji osiągnięty' });
    }

    // Dodaj członka
    await pool.query(
      'INSERT INTO members (name, role, organization_id) VALUES ($1, $2, $3)',
      [name, role || 'member', organizationId]
    );

    res.json({ success: true, message: 'Członek dodany' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// DELETE member (tylko admin lub user usuwa członka z własnej organizacji)
app.delete('/members/:id', async (req, res) => {
  const { id } = req.params;
  const { organizationId, requesterRole } = req.body;

  if (!id || !organizationId || !requesterRole) {
    return res.status(400).json({ success: false, message: 'Brak wymaganych danych' });
  }

  if (!['admin', 'user'].includes(requesterRole)) {
    return res.status(403).json({ success: false, message: 'Brak uprawnień' });
  }

  try {
    // Sprawdź czy członek należy do organizacji requester
    const memberResult = await pool.query('SELECT * FROM members WHERE id = $1 AND organization_id = $2', [id, organizationId]);

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Członek nie znaleziony w twojej organizacji' });
    }

    await pool.query('DELETE FROM members WHERE id = $1', [id]);

    res.json({ success: true, message: 'Członek usunięty' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// GET tasks - wszyscy widzą wszystkie zadania
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json({ success: true, tasks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// POST tasks (tylko admin)
app.post('/tasks', async (req, res) => {
  const { title, description, location, deadline, reward, requesterRole } = req.body;

  if (requesterRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Brak uprawnień' });
  }

  try {
    await pool.query(
      'INSERT INTO tasks (title, description, location, deadline, reward) VALUES ($1, $2, $3, $4, $5)',
      [title, description, location, deadline, reward]
    );
    res.json({ success: true, message: 'Zadanie dodane' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// DELETE task (tylko admin)
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { requesterRole } = req.body;

  if (requesterRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Brak uprawnień' });
  }

  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true, message: 'Zadanie usunięte' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
