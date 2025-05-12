<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

const login = async () => {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password'
    return
  }

  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      username: username.value,
      password: password.value
    })

    // ✅ เก็บ token และ user info
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))

    // ✅ ไปหน้าหลัก
    console.log('Login passed, redirecting...')
    router.push('/dashboard')
  } catch (err) {
    error.value = err.response?.data?.error || 'Login failed'
  }
}
</script>


<template>
  <div class="login-container">
    <div class="login-form-container">
      <h1 class="login-title">LOGIN</h1>
      <p class="login-subtitle">Welcome to Flight Reservation Management Website!</p>

      <div class="form-group">
        <div class="input-with-icon">
          <span class="icon">
            <img src="/login/person-icon.svg" alt="Person Icon" />
          </span>
          <input
            type="text"
            placeholder="Username"
            class="input-field"
            v-model="username"
          />
        </div>
      </div>

      <div class="form-group">
        <div class="input-with-icon">
          <span class="icon" style="left: 0.7rem;">
            <img src="/login/password-icon.svg" alt="Password Icon" />
          </span>
          <input
            type="password"
            placeholder="Password"
            class="input-field"
            v-model="password"
          />
        </div>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <button class="login-button" @click="login">
        Login Now
      </button>

      <p class="signup-link">
        or sign in <router-link to="/signup">here</router-link>
      </p>

    </div>

    <div class="image-container"></div>
  </div>
</template>

<style scoped>
/* === Same styles you had, PLUS these === */

.error-message {
  color: red;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.signup-link {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #999;
}

.signup-link a {
  color: #1d3a4c;
  font-weight: bold;
  text-decoration: underline;
}

.login-container {
  display: flex;
  height: 100vh;
  width: 100%;
}

.login-form-container {
  flex: 1;
  background-color: var(--c-soft-blue-1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.image-container {
  flex: 1;
  background-image: url("/login/right-side-cover.png");
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.login-title {
  color: #2c5d7c;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.login-subtitle {
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
}

.form-group {
  width: 100%;
  max-width: 320px;
  margin-bottom: 1.5rem;
}

.input-with-icon {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.icon {
  position: absolute;
  left: 1rem;
  top: 0.6rem;
  color: #999;
  z-index: 1;
}

.input-field,
input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.3s;
  background-color: white;
}

.login-button {
  background-color: #2c5d7c;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.login-button:hover {
  background-color: #1f4560;
}

@media (max-width: 1200px) {
  .login-form-container {
    flex: 2;
  }
  .image-container {
    flex: 1;
  }
}

@media (max-width: 992px) {
  .login-form-container {
    flex: 3;
  }
  .image-container {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  .login-form-container {
    flex: 1;
    height: 100vh;
    width: 100%;
    padding: 1.5rem;
  }
  .image-container {
    display: none;
  }
}
</style>
