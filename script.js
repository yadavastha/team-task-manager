const API_URL = 'https://team-task-manager-production-8fb2.up.railway.app'
let token = null
let role = null

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (res.ok) {
    const data = await res.json()
    token = data.token
    const payload = JSON.parse(atob(token.split('.')[1]))
    role = payload.role
    document.getElementById('login-container').style.display = 'none'
    document.getElementById('app-container').style.display = 'block'
    if (role === 'admin') {
      document.getElementById('admin-section').style.display = 'block'
    }
    loadTasks()
  }
})

document.getElementById('logoutBtn').addEventListener('click', () => {
  token = null
  role = null
  document.getElementById('app-container').style.display = 'none'
  document.getElementById('login-container').style.display = 'block'
})

async function loadTasks() {
  const res = await fetch(`${API_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (res.ok) {
    const tasks = await res.json()
    const list = document.getElementById('taskList')
    list.innerHTML = ''
    tasks.forEach(t => {
      const li = document.createElement('li')
      li.textContent = `${t.title} - ${t.status} - Due: ${t.due_date}`
      if (role === 'member') {
        const btn = document.createElement('button')
        btn.textContent = 'Mark Complete'
        btn.onclick = async () => {
          await fetch(`${API_URL}/tasks/${t.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'Completed' })
          })
          loadTasks()
        }
        li.appendChild(btn)
      }
      list.appendChild(li)
    })
  }
}

document.getElementById('createProjectBtn').addEventListener('click', async () => {
  const name = document.getElementById('projectName').value
  const description = document.getElementById('projectDesc').value
  await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, description })
  })
})
document.getElementById('createTaskBtn').addEventListener('click', async () => {
  const title = document.getElementById('taskTitle').value
  const description = document.getElementById('taskDesc').value
  const dueDate = document.getElementById('taskDue').value
  const assignedTo = document.getElementById('taskAssign').value
  const projectId = document.getElementById('taskProject').value
  await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, description, dueDate, assignedTo, projectId })
  })
})
