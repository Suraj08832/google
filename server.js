const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
    connectionString: 'postgresql://raghupati_user:n6kj8ZcI9DNV9Io7YwoZEOBfzCez1h8a@dpg-cvlb71adbo4c73d9osq0-a.oregon-postgres.render.com/raghupati',
    ssl: {
        rejectUnauthorized: false
    }
});

// Create table if not exists
async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY,
                filename TEXT,
                data BYTEA,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table created successfully');
    } catch (error) {
        console.error('Error creating table:', error);
    }
}

createTable();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files
app.use(express.static('public'));

// Handle photo uploads
app.post('/upload', upload.single('photo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    try {
        const filename = `photo_${Date.now()}.jpg`;
        await pool.query(
            'INSERT INTO photos (filename, data) VALUES ($1, $2)',
            [filename, req.file.buffer]
        );
        console.log('Photo saved successfully to PostgreSQL');
        res.send('Photo uploaded successfully');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error processing file');
    }
});

// Get all photos
app.get('/photos', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, filename, created_at FROM photos ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error fetching photos');
    }
});

// Get a specific photo
app.get('/photos/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM photos WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).send('Photo not found');
        }
        res.set('Content-Type', 'image/jpeg');
        res.send(result.rows[0].data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error fetching photo');
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 