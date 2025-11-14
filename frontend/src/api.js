const API_BASE = '' // proxied by Vite (/api -> http://127.0.0.1:8000)

function getToken() {
  return localStorage.getItem('apiToken')
}

export function getStoredToken() {
  return getToken()
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
  // Try to fetch current user profile if available
  try {
    const user = await getCurrentUser()
    return { token: data.token, user }
  } catch (err) {
    return { token: data.token }
  }
}

export async function getCurrentUser() {
  // Try a common endpoint; backend may expose /api/users/me/ or similar
  const possiblePaths = ['/api/users/me/', '/api/auth/user/', '/api/current_user/']
  for (const path of possiblePaths) {
    try {
      const res = await fetch(path, { headers: { ...authHeaders() } })
      if (res.ok) return res.json()
    } catch (e) {
      // ignore and try next
    }
  }
  // If no user endpoint exists, return minimal info from token presence
  const token = getToken()
  if (token) return { username: 'usuario' }
  throw new Error('No authenticated user')
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
