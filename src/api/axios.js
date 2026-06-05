import axios from 'axios'

// centralny klient axios — wszystkie zapytania do Django idą przez ten plik
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
})

// interceptor — przed każdym zapytaniem automatycznie dodaje token JWT z localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
