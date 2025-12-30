const API_BASE = "http://localhost/api";
const ROOT_USERNAME = "rahman_25";
const ROOT_PASSWORD = "rahmanilkom";

function setAuthUser(user) {
  localStorage.setItem("authUser", JSON.stringify(user));
}

function getAuthUser() {
  const raw = localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem("registeredUsers") || "[]");
  } catch (e) {
    return [];
  }
}

function saveLocalUsers(users) {
  localStorage.setItem("registeredUsers", JSON.stringify(users));
}

function deriveUsername(email) {
  if (!email) return "";
  return email.split("@")[0] || email;
}

async function loginRequest(identity, password) {
  // fixed root admin
  if (identity === ROOT_USERNAME && password === ROOT_PASSWORD) {
    return {
      name: "Muhammad Nur Rahman",
      username: ROOT_USERNAME,
      role: "admin",
      token: "root-admin"
    };
  }

  // try API
  try {
    const res = await fetch(`${API_BASE}/login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, password })
    });
    if (!res.ok) throw new Error("Login gagal");
    return await res.json();
  } catch (err) {
    // local fallback
    const users = getLocalUsers();
    const found = users.find(
      u =>
        u.email === identity ||
        u.username === identity ||
        deriveUsername(u.email) === identity
    );
    if (found && found.password === password) {
      return { name: found.name, username: found.username, role: "user", token: "local-user" };
    }
    throw new Error("Kredensial salah / akun tidak ditemukan");
  }
}

async function registerRequest(name, email, password) {
  try {
    const res = await fetch(`${API_BASE}/register.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "user" })
    });
    if (!res.ok) throw new Error("Registrasi gagal");
    return await res.json();
  } catch (err) {
    const users = getLocalUsers();
    if (users.some(u => u.email === email)) throw new Error("Email sudah terdaftar");
    const username = deriveUsername(email);
    const user = { name, email, username, password };
    users.push(user);
    saveLocalUsers(users);
    return { name, username, role: "user", token: "local-user" };
  }
}

function logout() {
  localStorage.removeItem("authUser");
  window.location.href = "welcome.html";
}

function enforceAuth() {
  const user = getAuthUser();
  const isPublic =
    location.pathname.endsWith("login.html") ||
    location.pathname.endsWith("register.html") ||
    location.pathname.endsWith("welcome.html");
  
  // Jika sudah login, redirect dari login/register ke dashboard
  if (user && (location.pathname.endsWith("login.html") || location.pathname.endsWith("register.html"))) {
    window.location.href = "index.html";
    return;
  }
  
  // Jika belum login, redirect ke welcome (kecuali halaman public)
  if (!user && !isPublic) {
    window.location.href = "welcome.html";
  }
}

// Validasi email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Cek kekuatan password
function checkPasswordStrength(password) {
  if (password.length < 8) return { strength: "weak", message: "Password terlalu pendek (min. 8 karakter)" };
  if (password.length < 12 && !/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
    return { strength: "medium", message: "Gunakan kombinasi huruf dan angka untuk keamanan lebih" };
  }
  if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
    return { strength: "strong", message: "Password kuat" };
  }
  return { strength: "medium", message: "Password cukup kuat" };
}

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const toggle = input.nextElementSibling;
  if (input.type === "password") {
    input.type = "text";
    toggle.textContent = "🙈";
  } else {
    input.type = "password";
    toggle.textContent = "👁";
  }
}

// Update password strength indicator
function updatePasswordStrength() {
  const passwordInput = document.getElementById("regPassword");
  const strengthDiv = document.getElementById("passwordStrength");
  if (!passwordInput || !strengthDiv) return;
  
  const password = passwordInput.value;
  if (password.length === 0) {
    strengthDiv.innerHTML = "";
    strengthDiv.className = "password-strength";
    return;
  }
  
  const result = checkPasswordStrength(password);
  strengthDiv.innerHTML = `<div class="password-strength-bar"></div>`;
  strengthDiv.className = `password-strength ${result.strength}`;
}

// Setup password strength listener
if (document.getElementById("regPassword")) {
  document.getElementById("regPassword").addEventListener("input", updatePasswordStrength);
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    
    // Clear previous errors
    document.getElementById("loginIdentityError").textContent = "";
    document.getElementById("loginPasswordError").textContent = "";
    const statusEl = document.getElementById("loginStatus");
    if (statusEl) statusEl.textContent = "";
    
    const identity = document.getElementById("loginIdentity").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    let hasError = false;
    
    // Validasi
    if (!identity) {
      document.getElementById("loginIdentityError").textContent = "Username atau email wajib diisi";
      hasError = true;
    }
    
    if (!password) {
      document.getElementById("loginPasswordError").textContent = "Password wajib diisi";
      hasError = true;
    }
    
    if (hasError) return;
    
    // Disable button during request
    const submitBtn = document.getElementById("loginSubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Memproses...";
    }
    
    try {
      const data = await loginRequest(identity, password);
      setAuthUser(data);
      if (statusEl) statusEl.textContent = "Login berhasil! Mengalihkan...";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } catch (err) {
      document.getElementById("loginPasswordError").textContent = err.message || "Login gagal";
      if (statusEl) statusEl.textContent = err.message || "Login gagal";
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    }
  });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    
    // Clear previous errors
    document.getElementById("regNameError").textContent = "";
    document.getElementById("regEmailError").textContent = "";
    document.getElementById("regPasswordError").textContent = "";
    document.getElementById("regPasswordConfirmError").textContent = "";
    const statusEl = document.getElementById("registerStatus");
    if (statusEl) statusEl.textContent = "";
    
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const passwordConfirm = document.getElementById("regPasswordConfirm").value.trim();
    let hasError = false;
    
    // Validasi nama
    if (!name) {
      document.getElementById("regNameError").textContent = "Nama wajib diisi";
      hasError = true;
    } else if (name.length < 3) {
      document.getElementById("regNameError").textContent = "Nama minimal 3 karakter";
      hasError = true;
    }
    
    // Validasi email
    if (!email) {
      document.getElementById("regEmailError").textContent = "Email wajib diisi";
      hasError = true;
    } else if (!validateEmail(email)) {
      document.getElementById("regEmailError").textContent = "Format email tidak valid";
      hasError = true;
    }
    
    // Validasi password
    if (!password) {
      document.getElementById("regPasswordError").textContent = "Password wajib diisi";
      hasError = true;
    } else {
      const strength = checkPasswordStrength(password);
      if (strength.strength === "weak") {
        document.getElementById("regPasswordError").textContent = strength.message;
        hasError = true;
      }
    }
    
    // Validasi konfirmasi password
    if (!passwordConfirm) {
      document.getElementById("regPasswordConfirmError").textContent = "Konfirmasi password wajib diisi";
      hasError = true;
    } else if (password !== passwordConfirm) {
      document.getElementById("regPasswordConfirmError").textContent = "Password tidak cocok";
      hasError = true;
    }
    
    if (hasError) return;
    
    // Disable button during request
    const submitBtn = document.getElementById("registerSubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Memproses...";
    }
    
    try {
      const data = await registerRequest(name, email, password);
      setAuthUser(data);
      if (statusEl) statusEl.textContent = "Registrasi berhasil! Mengalihkan...";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } catch (err) {
      if (err.message.includes("Email sudah terdaftar")) {
        document.getElementById("regEmailError").textContent = err.message;
      } else {
        if (statusEl) statusEl.textContent = err.message || "Registrasi gagal";
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Buat Akun";
      }
    }
  });
}

