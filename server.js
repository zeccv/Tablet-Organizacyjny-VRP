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
      role: user.role, // Zwracamy rolę
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// REJESTRACJA
app.post('/register', async (req, res) => {
  const { username, password, character_data, role = 'user' } = req.body; // domyślnie 'user'

  try {
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password_hash, character_data, role) VALUES ($1, $2, $3, $4)',
      [username, hash, character_data, role]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd rejestracji' });
  }
});

// Pobierz listę zadań (dla wszystkich)
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json({ success: true, tasks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// Dodaj zadanie (tylko admin)
app.post('/tasks', async (req, res) => {
  const { title, description, role } = req.body;

  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Brak uprawnień' });
  }

  try {
    await pool.query('INSERT INTO tasks (title, description) VALUES ($1, $2)', [title, description]);
    res.json({ success: true, message: 'Zadanie dodane' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// Usuń zadanie (tylko admin)
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'admin') {
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
