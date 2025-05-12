import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api' // เปลี่ยนถ้าใช้ ngrok
})

// ✅ แนบ token ทุก request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
