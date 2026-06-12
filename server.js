const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get Surah data
app.get('/api/surahs', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'surahs.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading surahs.json:', err);
            return res.status(500).json({ error: 'Failed to read Surah data' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseErr) {
            console.error('Error parsing surahs.json:', parseErr);
            res.status(500).json({ error: 'Failed to parse Surah data' });
        }
    });
});

// Fallback for SPA-like behavior or just serving the main file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
