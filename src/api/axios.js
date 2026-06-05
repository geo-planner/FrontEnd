import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000/api'

const api = axios.create({ baseURL: BASE_URL })

// Request interceptor — dołącza access token do każdego zapytania
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — obsługa wygasłego tokenu (401)
api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config

    // Jeśli 401 i nie próbowaliśmy jeszcze odświeżyć tokenu
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')

      if (refresh) {
        try {
          // Używamy czystego axios (nie api) żeby uniknąć pętli interceptorów
          const res = await axios.post(`${BASE_URL}/token/refresh/`, { refresh })
          localStorage.setItem('access_token', res.data.access)
          original.headers.Authorization = `Bearer ${res.data.access}`
          return api(original)  // ponów oryginalne zapytanie z nowym tokenem
        } catch {
          // refresh token też wygasł
        }
      }

      // Wyloguj i przekieruj do logowania
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
