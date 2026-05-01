const API_URL = 'http://localhost:3000/api';

// Global State
let tasks = [];
let notes = [];
let schedData = {};
let sessions = 0;

let timerInterval = null;
let timeLeft = 25 * 60;
let isRunning = false;
let currentMode = 'focus';
const modes = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

async function loadFromServer() {
    try {
        const res = await fetch(`${API_URL}/data`);
        const data = await res.json();
        tasks = data.tasks || [];
        notes = data.notes || [];
        schedData = data.schedData || {};
        sessions = data.sessions || 0;
        
        renderTasks();
        renderSched();
        renderNotes();
        updateDisplay();
    } catch (e) {
        console.error("Server offline. Check if node server.js is running.");
    }
}

async function saveToServer() {
    const dataToSave = { tasks, notes, schedData, sessions };
    try {
        await fetch(`${API_URL}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        });
    } catch (e) {
        console.error("Failed to sync with server.");
    }
}
function switchTab(id, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}

function renderTasks() {
    const list = document.getElementById('taskList');
    const empty = document.getElementById('taskEmpty');
    list.innerHTML = '';
    empty.style.display = tasks.length === 0 ? 'block' : 'none';
    
    tasks.forEach((t, i) => {
        const li = document.createElement('li');
        li.className = 'task-item' + (t.done ? ' done' : '');
        li.innerHTML = `
            <input type="checkbox" ${t.done ? 'checked' : ''} data-index="${i}" class="task-check"/>
            <span class="task-text">${t.text}</span>
            <span class="task-tag">${t.subject}</span>
            <button class="task-del" data-index="${i}">✕</button>
        `;
        list.appendChild(li);
    });

    document.querySelectorAll('.task-check').forEach(el => {
        el.addEventListener('change', async (e) => {
            const idx = e.target.getAttribute('data-index');
            tasks[idx].done = e.target.checked;
            renderTasks();
            await saveToServer(); 
        });
    });

    document.querySelectorAll('.task-del').forEach(el => {
        el.addEventListener('click', async (e) => {
            const idx = e.target.getAttribute('data-index');
            tasks.splice(idx, 1);
            renderTasks();
            await saveToServer();
        });
    });
}

async function addTask() {
    const input = document.getElementById('taskInput');
    const subject = document.getElementById('taskSubject').value;
    const text = input.value.trim();
    if (!text) return;
    tasks.unshift({ text, subject, done: false });
    input.value = '';
    renderTasks();
    await saveToServer(); 
}

function updateDisplay() {
    const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const s = String(timeLeft % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `${m}:${s}`;
    document.getElementById('sessionCount').textContent = `Sessions today: ${sessions}`;
    document.querySelectorAll('.pomo-dot').forEach((d, i) => {
        d.classList.toggle('filled', i < (sessions % 4));
    });
}

function toggleTimer() {
    const btn = document.getElementById('startBtn');
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        btn.textContent = 'Start';
    } else {
        isRunning = true;
        btn.textContent = 'Pause';
        timerInterval = setInterval(async () => {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                btn.textContent = 'Start';
                if (currentMode === 'focus') {
                    sessions++;
                    await saveToServer(); 
                }
                updateDisplay();
            }
        }, 1000);
    }
}

function renderSched() {
    const tbody = document.getElementById('schedBody');
    const slots = ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    tbody.innerHTML = '';
    slots.forEach(slot => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${slot}</td>` + days.map(day => {
            const key = `${day}_${slot}`;
            const val = schedData[key] || '';
            return `<td class="${val ? 'has-class' : ''}" data-key="${key}">${val}</td>`;
        }).join('');
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('td[data-key]').forEach(el => {
        el.addEventListener('click', async () => {
            const key = el.getAttribute('data-key');
            const val = prompt('Class name:', schedData[key] || '');
            if (val === null) return;
            if (!val.trim()) delete schedData[key];
            else schedData[key] = val.trim();
            renderSched();
            await saveToServer(); 
        });
    });
}

function renderNotes() {
    const grid = document.getElementById('notesGrid');
    const empty = document.getElementById('notesEmpty');
    grid.querySelectorAll('.note-card').forEach(n => n.remove());
    empty.style.display = notes.length === 0 ? 'block' : 'none';

    notes.forEach((n, i) => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <button class="note-del" data-index="${i}">✕</button>
            <textarea placeholder="Write..." data-index="${i}">${n}</textarea>
        `;
        grid.insertBefore(card, document.getElementById('addNoteBtn'));
    });

    grid.querySelectorAll('textarea').forEach(el => {
        el.addEventListener('blur', async (e) => {
            const idx = e.target.getAttribute('data-index');
            const val = e.target.value.trim();
            if (val) {
                notes[idx] = val;
                await saveToServer(); 
            }
        });
    });

    grid.querySelectorAll('.note-del').forEach(el => {
        el.addEventListener('click', async (e) => {
            const idx = e.target.getAttribute('data-index');
            notes.splice(idx, 1);
            renderNotes();
            await saveToServer(); 
        });
    });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-section'), btn));
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (isRunning) return;
        currentMode = btn.getAttribute('data-mode');
        timeLeft = modes[currentMode];
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateDisplay();
    });
});

document.getElementById('addTaskBtn').addEventListener('click', addTask);
document.getElementById('taskInput').addEventListener('keydown', (e) => { if(e.key === 'Enter') addTask(); });
document.getElementById('startBtn').addEventListener('click', toggleTimer);
document.getElementById('resetBtn').addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = modes[currentMode];
    document.getElementById('startBtn').textContent = 'Start';
    updateDisplay();
});

document.getElementById('addNoteBtn').addEventListener('click', async () => {
    notes.push('');
    renderNotes();
    await saveToServer();
});

loadFromServer();