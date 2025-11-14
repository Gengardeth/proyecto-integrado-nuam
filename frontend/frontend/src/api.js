const API_BASE = '' // proxied by Vite (/api -> http://127.0.0.1:8000)

function getToken() {
  return localStorage.getItem('apiToken')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Token ${token}` } : {}
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error: ${res.status} ${text}`)
  }
  const data = await res.json()
  if (data && Object.prototype.hasOwnProperty.call(data, 'results')) return data.results
  return data
}

export async function login(username, password) {
  const res = await fetch('/api-token-auth/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Login failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  if (data.token) {
    localStorage.setItem('apiToken', data.token)
  }
  return data
}

export function logout() {
  localStorage.removeItem('apiToken')
}

export async function fetchCalificaciones() {
  const res = await fetch('/api/calificaciones/', { headers: { ...authHeaders() } })
  return handleResponse(res)
}

export async function fetchContribuyentes() {
  const res = await fetch('/api/contribuyentes/', { headers: { ...authHeaders() } })
  return handleResponse(res)
}

export async function fetchParametros() {
  const res = await fetch('/api/parametros/', { headers: { ...authHeaders() } })
  return handleResponse(res)
}

export async function createCalificacion(payload) {
  const res = await fetch('/api/calificaciones/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function updateCalificacion(id, payload) {
  const res = await fetch(`/api/calificaciones/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function deleteCalificacion(id) {
  const res = await fetch(`/api/calificaciones/${id}/`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Delete failed: ${res.status} ${text}`)
  }
  return true
}
