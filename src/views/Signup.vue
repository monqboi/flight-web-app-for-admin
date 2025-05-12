<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from 'axios'
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faUser, faLock, faIdCard, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";

const router = useRouter();

const form = ref({
  username: '',
  password: '',
  firstname: '',
  middlename: '',
  lastname: '',
  email: '',
  phone: ''
})

const error = ref('')
const success = ref('')

const register = async () => {
  error.value = ''
  success.value = ''

  if (!form.value.username || !form.value.password || !form.value.firstname || !form.value.email) {
    error.value = 'Please fill in all required fields.'
    return
  }

  try {
    const res = await axios.post('http://localhost:3000/api/auth/register', form.value)
    success.value = '✅ Registered successfully!'
    console.log('User registered:', res.data)

    // Optional: redirect to login page after success
    setTimeout(() => {
      router.push('/login')
    }, 1500)

  } catch (err) {
    if (err.response?.status === 409) {
      error.value = 'Username or Email already exists.'
    } else {
      error.value = 'Registration failed. Try again.'
      console.error('Register error:', err)
    }
  }
}


</script>

<template>
  <div class="signup-container">
    <div class="signup-form-container">
      <h1 class="signup-title">SIGN UP</h1>
      <p class="signup-subtitle">How do I get started? Lorem ipsum dolor sit amet.</p>

      <!-- Input Fields -->
      <div class="form-group">
        <div class="input-with-icon">
          <span class="icon"><font-awesome-icon icon="user" /></span>
          <input type="text" placeholder="Username" v-model="form.username" class="input-field" />
        </div>
      </div>

      <div class="form-group">
        <div class="input-with-icon">
          <span class="icon"><font-awesome-icon icon="lock" /></span>
          <input type="password" placeholder="Password" v-model="form.password" class="input-field" />
        </div>
      </div>

      <div class="form-group">
        <div class="input-with-icon">
          <span class="icon"><font-awesome-icon icon="user-tag" /></span>
          <input type="text" placeholder="First name" v-model="form.firstname" class="input-field" />
        </div>
      </div>

      <div class="form-group">
        <div class="input-with-icon">
          <span class="icon"><font-awesome-icon icon="user-tag" /></span>
          <input type="text" placeholder="Middle name" v-model="form.middlename" class="input-field" />
        </div>
      </div>

      <div class="form-group">
        <div class="input-with-icon">
          <span class="icon"><font-awesome-icon icon="user-tag" /></span>
          <input type="text" placeholder="Last name" v-model="form.lastname" class="input-field" />
        </div>
      </div>

      <div class="form-group">
        <div class="input-with-icon">
          <span class="icon"><font-awesome-icon icon="envelope" /></span>
          <input type="email" placeholder="Email" v-model="form.email" class="input-field" />
        </div>
      </div>

      <div class="form-group">
        <div class="input-with-icon">
          <span class="icon"><font-awesome-icon icon="phone" /></span>
          <input type="text" placeholder="Phone" v-model="form.phone" class="input-field" />
        </div>
      </div>

      <!-- Feedback -->
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>

      <!-- Button -->
      <button class="signup-button" @click="register">Sign Up</button>
    </div>

    <div class="image-container"></div>
  </div>
</template>


<style scoped>
.signup-container {
  display: flex;
  height: 100vh;
  width: 100%;
}

.signup-form-container {
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
}

.signup-title {
  color: #2c5d7c;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.signup-subtitle {
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
}

.form-group {
  width: 100%;
  max-width: 320px;
  margin-bottom: 1.2rem;
}

.input-with-icon {
  position: relative;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.2rem;
  z-index: 1;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  color: #333;
  background-color: white;
  transition: border-color 0.3s;
}

.input-field:focus {
  outline: none;
  border-color: #2c5d7c;
}

.error-message {
  color: red;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.signup-button {
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

.signup-button:hover {
  background-color: #1f4560;
}

@media (max-width: 768px) {
  .signup-container {
    flex-direction: column;
  }
  .signup-form-container {
    height: 100vh;
    width: 100%;
    padding: 1.5rem;
  }
  .image-container {
    display: none;
  }
}
</style>
