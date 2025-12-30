const divisiOptions = ["BPH", "Humas", "PSDM", "Riset", "Media", "Kewirausahaan", "Acara"];
const leadershipRoles = ["ketua umum", "wakil ketua umum"];
let currentUser = null;
let anggota = [];
let editingIndex = null;
let viewMode = localStorage.getItem("preferredViewMode") || "card"; // card | table
let carouselIndex = 0;
let filterState = {
  keyword: "",
  divisi: "semua",
  sort: "nama",
};

const placeholderFoto = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60";

function loadData() {
  const stored = localStorage.getItem("anggotaData");
  if (stored) {
    anggota = JSON.parse(stored);
  } else {
    anggota = [
      { nama: "Muhammad Nur Rahman", nim: "21415000", divisi: "", peran: "Ketua Umum", foto: "ProfileRahman.jpeg" },
      { nama: "Siti Aulia", nim: "21415016", divisi: "", peran: "Wakil Ketua Umum", foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=60" },
      { nama: "Alya Pratiwi", nim: "21415001", divisi: "Humas", peran: "Ketua Divisi", foto: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=60" },
      { nama: "Rizal Nugraha", nim: "21415007", divisi: "Humas", peran: "Wakil Divisi", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=60" },
      { nama: "Bagas Dirgantara", nim: "21415002", divisi: "PSDM", peran: "Ketua Divisi", foto: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=60" },
      { nama: "Nina Ramadhani", nim: "21415008", divisi: "PSDM", peran: "Wakil Divisi", foto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60" },
      { nama: "Citra Lestari", nim: "21415003", divisi: "Media", peran: "Ketua Divisi", foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=60" },
      { nama: "Yoga Satria", nim: "21415009", divisi: "Media", peran: "Wakil Divisi", foto: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=60" },
      { nama: "Davin Surya", nim: "21415004", divisi: "Riset", peran: "Ketua Divisi", foto: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=60" },
      { nama: "Yuliana Dewi", nim: "21415010", divisi: "Riset", peran: "Wakil Divisi", foto: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=60" },
      { nama: "Eka Wibowo", nim: "21415005", divisi: "Acara", peran: "Ketua Divisi", foto: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=60" },
      { nama: "Rara Ayuning", nim: "21415011", divisi: "Acara", peran: "Wakil Divisi", foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=60" },
      { nama: "Farah Rahma", nim: "21415006", divisi: "Kewirausahaan", peran: "Ketua Divisi", foto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60" },
      { nama: "Andra Putra", nim: "21415012", divisi: "Kewirausahaan", peran: "Wakil Divisi", foto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60" },
      { nama: "Laras Puspita", nim: "21415013", divisi: "Media", peran: "Konten Kreator", foto: "" },
      { nama: "Bima Santoso", nim: "21415014", divisi: "Humas", peran: "Anggota", foto: "" },
      { nama: "Yusuf Maulana", nim: "21415015", divisi: "Riset", peran: "Data Analyst", foto: "" },
    ];
  }
}

function saveData() {
  localStorage.setItem("anggotaData", JSON.stringify(anggota));
}

function syncFiltersUI() {
  const filterDivisi = document.getElementById("filterDivisi");
  filterDivisi.innerHTML = `<option value="semua">Semua divisi</option>`;
  const set = new Set([...divisiOptions, ...anggota.map(a => a.divisi)]);
  set.forEach(d => {
    filterDivisi.innerHTML += `<option value="${d}">${d}</option>`;
  });

  const datalist = document.getElementById("divisiList");
  datalist.innerHTML = "";
  set.forEach(d => (datalist.innerHTML += `<option value="${d}" />`));

  const chips = document.getElementById("divisionChips");
  chips.innerHTML = "";
  set.forEach(d => {
    const chip = document.createElement("button");
    chip.className = "chip" + (filterState.divisi === d ? " active" : "");
    chip.textContent = d;
    chip.onclick = () => {
      filterState.divisi = d;
      filterDivisi.value = d;
      renderAll();
    };
    chips.appendChild(chip);
  });
}

function applyFilters() {
  let data = [...anggota];
  const key = filterState.keyword.toLowerCase();

  if (key) {
    data = data.filter(a =>
      [a.nama, a.nim, a.divisi, a.peran]
        .join(" ")
        .toLowerCase()
        .includes(key)
    );
  }

  if (filterState.divisi !== "semua") {
    data = data.filter(a => a.divisi === filterState.divisi);
  }

  data.sort((a, b) => {
    const field = filterState.sort;
    return a[field].localeCompare(b[field]);
  });

  return data;
}

function renderStats(data) {
  document.getElementById("totalAnggota").innerText = data.length;
  const divisiCount = new Set(data.map(a => a.divisi)).size;
  document.getElementById("totalDivisi").innerText = divisiCount;
  document.getElementById("newJoin").innerText = Math.max(data.length - 4, 0);
}

function renderTable(data) {
  const table = document.getElementById("anggotaTable");
  table.innerHTML = "";

  data.forEach((a, i) => {
    const idx = anggota.indexOf(a);
    const isLeader = leadershipRoles.some(r => (a.peran || "").toLowerCase().includes(r));
    const row = document.createElement("tr");
    if (isLeader) row.classList.add("leader-row");
    const fotoUrl = a.foto || placeholderFoto;
    row.innerHTML = `
      <td><img class="avatar" src="${fotoUrl}" alt="${a.nama}" onerror="this.src='${placeholderFoto}'" /></td>
      <td>${a.nama}</td>
      <td>${a.nim}</td>
      <td>${a.divisi ? `<span class="badge">${a.divisi}</span>` : "-"}</td>
      <td>${a.peran || "-"}</td>
      <td class="actions">
        ${currentUser && currentUser.role === "admin"
          ? `<button class="icon-btn" title="Edit" onclick="editAnggota(${idx})">✎</button>
             <button class="icon-btn danger" title="Hapus" onclick="hapusAnggota(${idx})">🗑</button>`
          : `<span class="muted">View only</span>`}
      </td>
    `;
    table.appendChild(row);
  });
}

function renderCards(data) {
  const grid = document.getElementById("cardGrid");
  grid.innerHTML = "";
  data.forEach((a, i) => {
    const idx = anggota.indexOf(a);
    const isLeader = leadershipRoles.some(r => (a.peran || "").toLowerCase().includes(r));
    const card = document.createElement("div");
    card.className = "anggota-card glass" + (isLeader ? " leader-card" : "");
    const fotoUrl = a.foto || placeholderFoto;
    card.innerHTML = `
      <div class="card-hero" style="background-image:url('${fotoUrl}')"></div>
      <div class="card-body">
        <div class="card-top">
          <div>
            <h4>${a.nama}</h4>
            <p class="muted">${a.peran || "Anggota"}</p>
          </div>
          ${a.divisi ? `<span class="badge">${a.divisi}</span>` : ""}
        </div>
        <p class="muted">NIM: ${a.nim}</p>
        ${isLeader ? `<div class="leader-tag">${a.peran}</div>` : ""}
        <div class="card-actions">
          ${currentUser && currentUser.role === "admin"
            ? `<button class="ghost" onclick="editAnggota(${idx})">Edit</button>
               <button class="ghost danger" onclick="hapusAnggota(${idx})">Hapus</button>`
            : `<span class="muted">View only</span>`}
          </div>
        </div>
      `;
    // Add error handling for background images
    const heroDiv = card.querySelector('.card-hero');
    if (heroDiv && a.foto) {
      const img = new Image();
      img.onerror = () => {
        heroDiv.style.backgroundImage = `url('${placeholderFoto}')`;
      };
      img.src = a.foto;
    }
    grid.appendChild(card);
  });
}

function renderCarousel(data) {
  const track = document.getElementById("carouselTrack");
  track.innerHTML = "";
  data.slice(carouselIndex, carouselIndex + 3).forEach(a => {
    const item = document.createElement("div");
    item.className = "carousel-item";
    const fotoUrl = a.foto || placeholderFoto;
    item.innerHTML = `
      <div class="carousel-photo" style="background-image:url('${fotoUrl}')"></div>
      <div class="carousel-info">
        <h4>${a.nama}</h4>
        <p>${a.peran || "Anggota"}</p>
        ${a.divisi ? `<span class="badge">${a.divisi}</span>` : ""}
        <p class="muted">${a.nim}</p>
      </div>
    `;
    // Add error handling for background images
    const photoDiv = item.querySelector('.carousel-photo');
    if (photoDiv && a.foto) {
      const img = new Image();
      img.onerror = () => {
        photoDiv.style.backgroundImage = `url('${placeholderFoto}')`;
      };
      img.src = a.foto;
    }
    track.appendChild(item);
  });
}

function renderAll() {
  const data = applyFilters();
  renderStats(data);
  renderTable(data);
  renderCards(data);
  renderCarousel(data);
  renderLeaders();
  syncFiltersUI();
  updateViewMode();
}

function openModal(editIndex = null) {
  if (currentUser.role !== "admin") return alert("Mode view only. Login admin untuk mengedit.");
  editingIndex = editIndex;
  document.getElementById("modal").style.display = "flex";
  document.getElementById("modalTitle").innerText = editIndex === null ? "Tambah Anggota" : "Edit Anggota";
  if (editIndex !== null) {
    const a = anggota[editIndex];
    document.getElementById("nama").value = a.nama;
    document.getElementById("nim").value = a.nim;
    document.getElementById("divisi").value = a.divisi;
    document.getElementById("peran").value = a.peran || "";
    document.getElementById("foto").value = a.foto || "";
  }
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("nama").value = "";
  document.getElementById("nim").value = "";
  document.getElementById("divisi").value = "";
  document.getElementById("peran").value = "";
  document.getElementById("foto").value = "";
  editingIndex = null;
}

function saveAnggota() {
  const nama = document.getElementById("nama").value.trim();
  const nim = document.getElementById("nim").value.trim();
  const divisi = document.getElementById("divisi").value.trim() || "Umum";
  const peran = document.getElementById("peran").value.trim();
  const foto = document.getElementById("foto").value.trim();

  if (!nama || !nim) return alert("Nama & NIM wajib diisi");

  const record = { nama, nim, divisi, peran, foto };

  if (editingIndex !== null) {
    anggota[editingIndex] = record;
  } else {
    anggota.unshift(record);
  }

  saveData();
  closeModal();
  renderAll();
}

function editAnggota(index) {
  openModal(index);
}

function hapusAnggota(index) {
  if (currentUser.role !== "admin") return alert("Mode view only. Login admin untuk menghapus.");
  if (!confirm("Hapus anggota ini?")) return;
  anggota.splice(index, 1);
  saveData();
  renderAll();
}

function searchAnggota(keyword) {
  filterState.keyword = keyword;
  renderAll();
}

function setMode(mode) {
  viewMode = mode;
  updateViewMode();
}

function toggleView() {
  viewMode = viewMode === "card" ? "table" : "card";
  updateViewMode();
}

function updateViewMode() {
  const cards = document.getElementById("cardsSection");
  const table = document.getElementById("tableSection");
  const pillCard = document.getElementById("modeCard");
  const pillTable = document.getElementById("modeTable");

  if (viewMode === "card") {
    cards.style.display = "block";
    table.style.display = "none";
    pillCard.classList.add("active");
    pillTable.classList.remove("active");
  } else {
    cards.style.display = "none";
    table.style.display = "block";
    pillTable.classList.add("active");
    pillCard.classList.remove("active");
  }
}

function moveCarousel(step) {
  const data = applyFilters();
  const maxStart = Math.max(data.length - 3, 0);
  carouselIndex = Math.min(Math.max(carouselIndex + step, 0), maxStart);
  renderCarousel(data);
}

function renderLeaders() {
  const grid = document.getElementById("leaderGrid");
  if (!grid) return;
  const leaders = anggota
    .filter(a => leadershipRoles.some(r => (a.peran || "").toLowerCase().includes(r)))
    .sort((a, b) => {
      const rank = role => (role.toLowerCase().includes("ketua umum") ? 0 : 1);
      return rank(a.peran || "") - rank(b.peran || "");
    });
  grid.innerHTML = "";
  leaders.forEach(a => {
    const card = document.createElement("div");
    card.className = "leader-card glass";
    const fotoUrl = a.foto || placeholderFoto;
    card.innerHTML = `
      <div class="leader-hero" style="background-image:url('${fotoUrl}')" onerror="this.style.backgroundImage='url(${placeholderFoto})'"></div>
      <div class="leader-body">
        <div class="leader-role">${a.peran}</div>
        <h4>${a.nama}</h4>
        <p class="muted">${a.divisi ? `${a.divisi} · ` : ""}NIM ${a.nim}</p>
      </div>
    `;
    // Add error handling for background images
    const heroDiv = card.querySelector('.leader-hero');
    if (heroDiv && a.foto) {
      const img = new Image();
      img.onerror = () => {
        heroDiv.style.backgroundImage = `url('${placeholderFoto}')`;
      };
      img.src = a.foto;
    }
    grid.appendChild(card);
  });
}

function getCurrentUser() {
  const raw = localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function applyRoleUI() {
  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.disabled = !currentUser || currentUser.role !== "admin";
  const authStatus = document.getElementById("authStatus");
  if (authStatus) authStatus.innerText = `${(currentUser && currentUser.name) || "Tamu"} (${(currentUser && currentUser.role) || "user"})`;
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.style.display = currentUser ? "block" : "none";
}

function setupListeners() {
  document.getElementById("searchInput").addEventListener("input", e => {
    searchAnggota(e.target.value);
  });

  document.getElementById("filterDivisi").addEventListener("change", e => {
    filterState.divisi = e.target.value;
    renderAll();
  });

  document.getElementById("sortBy").addEventListener("change", e => {
    filterState.sort = e.target.value;
    renderAll();
  });
}

// Make logout available globally
window.logout = function() {
  localStorage.removeItem("authUser");
  window.location.href = "welcome.html";
};

currentUser = getCurrentUser();
if (!currentUser) {
  window.location.href = "welcome.html";
} else {
  loadData();
  setupListeners();
  renderAll();
  applyRoleUI();
}