const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const DB_FILE = './db.json';

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ 
        users: [
            { id: 1, username: "admin", password: "123", role: "Admin" },
            { id: 2, username: "member", password: "123", role: "Member" }
        ],
        tasks: [] 
    }));
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = JSON.parse(fs.readFileSync(DB_FILE));
    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) res.json({ success: true, user });
    else res.status(401).json({ success: false });
});

app.get('/api/tasks', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE));
    res.json(data.tasks);
});

app.post('/api/tasks', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE));
    data.tasks = req.body;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => console.log(`Server on ${PORT}`));