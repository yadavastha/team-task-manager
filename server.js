const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const getData = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const saveData = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

app.get('/api/tasks', (req, res) => {
    res.json(getData());
});

app.post('/api/tasks', (req, res) => {
    const data = getData();
    const newTask = { id: Date.now(), ...req.body };
    data.tasks.push(newTask);
    saveData(data);
    res.status(201).json(newTask);
});

app.patch('/api/tasks/:id', (req, res) => {
    const data = getData();
    const taskIndex = data.tasks.findIndex(t => t.id == req.params.id);
    if (taskIndex > -1) {
        data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...req.body };
        saveData(data);
        res.json(data.tasks[taskIndex]);
    } else {
        res.status(404).send();
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    const data = getData();
    data.tasks = data.tasks.filter(t => t.id != req.params.id);
    saveData(data);
    res.status(204).send();
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});