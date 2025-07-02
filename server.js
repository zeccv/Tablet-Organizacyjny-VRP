// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// PostgreSQL config — wstaw tu swój connection string z Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // lub wpisz go tu jako string
  ssl: { rejectUnauthorized: false }
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
      username: user.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// (Opcjonalnie) REJESTRACJA
app.post('/register', async (req, res) => {
  const { username, password, character_data } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password_hash, character_data) VALUES ($1, $2, $3)',
      [username, hash, character_data]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd rejestracji' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
