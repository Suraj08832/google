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

// Enable CORS for all origins
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

// Serve static files
app.use(express.static('public'));

// Handle photo uploads
app.post('/upload', upload.single('photo'), async (req, res) => {
    if (!req.file) {
        console.log('No file received in upload request');
        return res.status(400).send('No file uploaded');
    }

    try {
        const filename = `photo_${Date.now()}.jpg`;
        console.log('Attempting to save file:', filename);
        
        await pool.query(
            'INSERT INTO photos (filename, data) VALUES ($1, $2)',
            [filename, req.file.buffer]
        );
        
        console.log('Photo saved successfully to PostgreSQL:', filename);
        res.send('Photo uploaded successfully');
    } catch (error) {
        console.error('Error saving photo:', error);
        res.status(500).send('Error processing file');
    }
});

// Get all photos
app.get('/photos', async (req, res) => {
    try {
        console.log('Fetching all photos from database');
        const result = await pool.query('SELECT id, filename, created_at FROM photos ORDER BY created_at DESC');
        console.log(`Found ${result.rows.length} photos`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).send('Error fetching photos');
    }
});

// Get a specific photo
app.get('/photos/:id', async (req, res) => {
    try {
        console.log('Fetching photo with ID:', req.params.id);
        const result = await pool.query('SELECT data FROM photos WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            console.log('Photo not found with ID:', req.params.id);
            return res.status(404).send('Photo not found');
        }
        
        console.log('Photo found, sending response');
        res.set('Content-Type', 'image/jpeg');
        res.send(result.rows[0].data);
    } catch (error) {
        console.error('Error fetching photo:', error);
        res.status(500).send('Error fetching photo');
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Server is accessible from other devices on your network');
}); 