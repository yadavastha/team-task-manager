const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const secret = 'secretkey'

app.post('/auth/signup', async (req, res) => {
  const { email, password, role } = req.body
  const hash = await bcrypt.hash(password, 10)
  await pool.query('INSERT INTO users(email,password,role) VALUES($1,$2,$3)', [email, hash, role])
  res.sendStatus(201)
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
  if (result.rows.length === 0) return res.sendStatus(401)
  const user = result.rows[0]
  const match = await bcrypt.compare(password, user.password)
  if (!match) return res.sendStatus(401)
  const token = jwt.sign({ id: user.id, role: user.role }, secret)
  res.json({ token })
})

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.sendStatus(401)
  const token = header.split(' ')[1]
  try {
    req.user = jwt.verify(token, secret)
    next()
  } catch {
    res.sendStatus(403)
  }
}

app.post('/projects', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403)
  const { name, description } = req.body
  await pool.query('INSERT INTO projects(name,description) VALUES($1,$2)', [name, description])
  res.sendStatus(201)
})

app.post('/tasks', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403)
  const { title, description, dueDate, assignedTo, projectId } = req.body
  await pool.query('INSERT INTO tasks(title,description,due_date,assigned_to,project_id,status) VALUES($1,$2,$3,$4,$5,$6)', [title, description, dueDate, assignedTo, projectId, 'Pending'])
  res.sendStatus(201)
})

app.get('/dashboard', auth, async (req, res) => {
  if (req.user.role === 'member') {
    const result = await pool.query('SELECT * FROM tasks WHERE assigned_to=$1', [req.user.id])
    res.json(result.rows)
  } else {
    const result = await pool.query('SELECT * FROM tasks')
    res.json(result.rows)
  }
})

app.patch('/tasks/:id/status', auth, async (req, res) => {
  const { status } = req.body
  await pool.query('UPDATE tasks SET status=$1 WHERE id=$2', [status, req.params.id])
  res.sendStatus(200)
})

app.listen(8080)
