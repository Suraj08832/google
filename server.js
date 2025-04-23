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

// Security headers middleware
app.use((req, res, next) => {
    // Enable CORS for all origins
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Add security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:;");
    res.header('Permissions-Policy', 'camera=*');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with proper headers
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        }
    }
}));

// Handle photo uploads
app.post('/upload', upload.single('photo'), async (req, res) => {
    console.log('Upload request received from:', req.headers['user-agent']);
    console.log('Request headers:', req.headers);
    
    if (!req.file) {
        console.log('No file received in upload request');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const filename = `photo_${Date.now()}.jpg`;
        console.log('Attempting to save file:', filename);
        console.log('File size:', req.file.size);
        
        const result = await pool.query(
            'INSERT INTO photos (filename, data) VALUES ($1, $2) RETURNING id',
            [filename, req.file.buffer]
        );
        
        console.log('Photo saved successfully to PostgreSQL:', filename);
        res.json({ 
            success: true, 
            message: 'Photo uploaded successfully',
            photoId: result.rows[0].id
        });
    } catch (error) {
        console.error('Error saving photo:', error);
        res.status(500).json({ error: 'Error processing file' });
    }
});

// Get all photos
app.get('/photos', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, filename, created_at FROM photos ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: 'Error fetching photos' });
    }
});

// Get a specific photo
app.get('/photos/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM photos WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        res.set('Content-Type', 'image/jpeg');
        res.send(result.rows[0].data);
    } catch (error) {
        console.error('Error fetching photo:', error);
        res.status(500).json({ error: 'Error fetching photo' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Server is accessible from other devices on your network');
}); 