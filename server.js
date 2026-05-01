const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const DB_FILE = './db.json';

app.get('/api/data', (req, res) => {
    if (!fs.existsSync(DB_FILE)) {
        return res.json({ tasks: [], notes: [], schedData: {}, sessions: 0 });
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE));
    res.json(data);
});

app.post('/api/save', (req, res) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2));
    res.status(200).send({ message: "Data synced to server" });
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));