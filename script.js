// script.js

// Login
async function loginUser(email, password) {
  const res = await fetch("https://team-task-manager-production-8fb2.up.railway.app/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

// Signup
async function signupUser(email, password, role) {
  const res = await fetch("https://team-task-manager-production-8fb2.up.railway.app/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role })
  });
  return res.json();
}

// Get Projects
async function getProjects() {
  const res = await fetch("https://team-task-manager-production-8fb2.up.railway.app/projects");
  return res.json();
}

// Add Task
async function addTask(title, description, projectId, assignedTo) {
  const res = await fetch("https://team-task-manager-production-8fb2.up.railway.app/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, projectId, assignedTo })
  });
  return res.json();
}
