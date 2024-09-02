const express = require('express');
const app = express();
const port = 3000;

// Middleware untuk parsing JSON
app.use(express.json());

// Route GET untuk endpoint '/api'
app.get('/api', (req, res) => {
    res.send('Hello, this is your API!');
});

// Route POST untuk menerima data
app.post('/api/data', (req, res) => {
    const { name, age } = req.body;
    res.json({
        message: 'Data received successfully',
        data: { name, age }
    });
});

const users = {
    user1: { name: 'John Doe', email: 'john@example.com' },
    user2: { name: 'Jane Smith', email: 'jane@example.com' }
};

// Rute POST untuk /api/chat
app.post('/api/chat', (req, res) => {
    res.json({
        message: 'Data retrieved successfully',
        data: users
    });
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
