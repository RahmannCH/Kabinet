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

function enforceAuth() {
  const user = getAuthUser();
  const isPublic =
    location.pathname.endsWith("login.html") ||
    location.pathname.endsWith("register.html") ||
    location.pathname.endsWith("welcome.html");
  if (!user && !isPublic) {
    window.location.href = "welcome.html";
  }
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const identity = document.getElementById("loginIdentity").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    try {
      const data = await loginRequest(identity, password);
      setAuthUser(data);
      window.location.href = "index.html";
    } catch (err) {
      alert(err.message || "Login gagal");
    }
  });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    try {
      const data = await registerRequest(name, email, password);
      setAuthUser(data);
      window.location.href = "index.html";
    } catch (err) {
      alert(err.message || "Registrasi gagal");
    }
  });
}

