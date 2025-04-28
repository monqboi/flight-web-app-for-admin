<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faUser, faLock, faIdCard, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";

const router = useRouter();
const username = ref('');
const password = ref('');
const firstname = ref('');
const middlename = ref('');
const lastname = ref('');
const email = ref('');
const phone = ref('');
const errorMessage = ref('');

const fields = [
  { placeholder: "Username", type: "text", model: username, icon: faUser },
  { placeholder: "Password", type: "password", model: password, icon: faLock },
  { placeholder: "Firstname", type: "text", model: firstname, icon: faIdCard },
  { placeholder: "Middlename", type: "text", model: middlename, icon: faIdCard },
  { placeholder: "Lastname", type: "text", model: lastname, icon: faIdCard },
  { placeholder: "Email", type: "email", model: email, icon: faEnvelope },
  { placeholder: "Phone", type: "tel", model: phone, icon: faPhone },
];

function handleSignup() {
  if (!username.value || !password.value || !firstname.value || !lastname.value || !email.value || !phone.value) {
    errorMessage.value = "Please fill in all required fields.";
    return;
  }

  console.log("New user created:", {
    username: username.value,
    password: password.value,
    firstname: firstname.value,
    middlename: middlename.value,
    lastname: lastname.value,
    email: email.value,
    phone: phone.value
  });

  router.push('/login');
}
</script>

<template>
  <div class="signup-container">
    <div class="signup-form-container">
      <h1 class="signup-title">SIGN UP</h1>
      <p class="signup-subtitle">How to i get started lorem ipsum dolor at?</p>

      <div class="form-group" v-for="(field, index) in fields" :key="index">
        <div class="input-with-icon">
          <span class="icon">
            <font-awesome-icon :icon="field.icon" />
          </span>
          <input
            :type="field.type"
            :placeholder="field.placeholder"
            v-model="field.model.value"
            class="input-field"
          />
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <button class="signup-button" @click="handleSignup">
        Sign Up
      </button>
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
