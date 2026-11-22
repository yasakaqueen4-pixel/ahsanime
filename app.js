const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "ahsanime_anime_v1";
const WATCHLIST_KEY = "ahsanime_watchlist_v1";
const HISTORY_KEY = "ahsanime_history_v1";

let animeList = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let watchlist = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
let currentAnime = null;
let temporaryVideoURL = null;
let temporaryPosterURL = null;

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(animeList));
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("toast");
  setTimeout(() => toast.classList.remove("toast"), 2500);
}

function showView(view) {
  $("homeView").classList.toggle("hidden", view !== "home");
  $("savedView").classList.toggle("hidden",
    view !== "watchlist" && view !== "history");
  $("adminView").classList.toggle("hidden", view !== "admin");

  if (view === "watchlist") renderSaved("watchlist");
  if (view === "history") renderSaved("history");
  if (view === "home") renderAnime();
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

// Dark / Light Mode
$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "ahsanime_theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
});

if (localStorage.getItem("ahsanime_theme") === "light") {
  document.body.classList.add("light");
}

// Search and Filters
["search", "category", "language"].forEach(id => {
  $(id).addEventListener("input", renderAnime);
  $(id).addEventListener("change", renderAnime);
});

function renderAnime() {
  const grid = $("animeGrid");
  const query = $("search").value.toLowerCase().trim();
  const category = $("category").value;
  const language = $("language").value;

  const results = animeList.filter(anime => {
    if (!anime.published) return false;

    const matchesSearch =
      anime.title.toLowerCase().includes(query);

    const matchesCategory =
      !category || anime.categories.includes(category);

    const matchesLanguage =
      !language || anime.language === language;

    return matchesSearch && matchesCategory && matchesLanguage;
  });

  if (!results.length) {
    grid.innerHTML = "<p>No anime found. Admin can add anime later.</p>";
    return;
  }

  grid.innerHTML = results.map(anime => `
    <article class="card" data-id="${escapeHTML(anime.id)}">
      <img src="${escapeHTML(anime.poster || "")}"
           alt="${escapeHTML(anime.title)}"
           onerror="this.style.opacity='.2'">
      <div>
        <h3>${escapeHTML(anime.title)}</h3>
        <p class="muted">${escapeHTML(anime.language)}</p>
        <p class="muted">${escapeHTML(anime.categories.join(", "))}</p>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      openAnime(card.dataset.id);
    });
  });
}

// Anime Player
function openAnime(id) {
  const anime = animeList.find(item => item.id === id);
  if (!anime) return;

  currentAnime = anime;

  $("playerTitle").textContent = anime.title;
  $("playerDescription").textContent = anime.description || "";

  const player = $("player");
  player.pause();
  player.removeAttribute("src");
  player.load();

  if (anime.video) {
    player.src = anime.video;
    player.load();
  }

  $("subtitleSelect").value = "";
  $("subtitleStatus").textContent =
    "Subtitles are available when subtitle files are connected.";

  $("playerDialog").showModal();

  history = history.filter(item => item !== id);
  history.unshift(id);
  history = history.slice(0, 50);
  saveData();
}

$("closePlayer").addEventListener("click", () => {
  $("player").pause();
  $("playerDialog").close();
});

$("saveWatchlist").addEventListener("click", () => {
  if (!currentAnime) return;

  if (watchlist.includes(currentAnime.id)) {
    watchlist = watchlist.filter(id => id !== currentAnime.id);
    showToast("Removed from Watchlist");
  } else {
    watchlist.push(currentAnime.id);
    showToast("Added to Watchlist");
  }

  saveData();
});

function renderSaved(type) {
  const ids = type === "watchlist" ? watchlist : history;
  const items = ids.map(id =>
    animeList.find(anime => anime.id === id)
  ).filter(Boolean);

  $("savedTitle").textContent =
    type === "watchlist" ? "My Watchlist" : "Watch History";

  $("savedGrid").innerHTML = items.length
    ? items.map(anime => `
      <article class="card" data-id="${escapeHTML(anime.id)}">
        <img src="${escapeHTML(anime.poster || "")}"
             alt="${escapeHTML(anime.title)}">
        <div><h3>${escapeHTML(anime.title)}</h3></div>
      </article>
    `).join("")
    : "<p>Nothing here yet.</p>";

  $("savedGrid").querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openAnime(card.dataset.id));
  });
}

// Account UI
$("accountBtn").addEventListener("click", () => {
  $("accountDialog").showModal();
});

$("loginBtn").addEventListener("click", () => {
  $("authStatus").textContent =
    "Firebase Authentication backend setup is required for secure login.";
});

$("signupBtn").addEventListener("click", () => {
  $("authStatus").textContent =
    "Firebase Authentication backend setup is required for secure signup.";
});

$("resetPassword").addEventListener("click", () => {
  $("authStatus").textContent =
    "Password reset will work after Firebase Authentication setup.";
});

// Admin navigation - frontend prototype only
$("adminNav").classList.remove("hidden");

$("animeForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("animeId").value || crypto.randomUUID();
  const existing = animeList.find(item => item.id === id);

  const videoFile = $("video").files[0];
  const posterFile = $("poster").files[0];

  if (videoFile) {
    if (temporaryVideoURL) URL.revokeObjectURL(temporaryVideoURL);
    temporaryVideoURL = URL.createObjectURL(videoFile);
  }

  if (posterFile) {
    if (temporaryPosterURL) URL.revokeObjectURL(temporaryPosterURL);
    temporaryPosterURL = URL.createObjectURL(posterFile);
  }

  const anime = {
    id,
    title: $("title").value.trim(),
    description: $("description").value.trim(),
    categories: $("categories").value
      .split(",").map(x => x.trim()).filter(Boolean),
    language: $("audioLanguage").value,
    poster: temporaryPosterURL || existing?.poster || "",
    video: temporaryVideoURL || $("videoUrl").value.trim() || existing?.video || "",
    published: $("published").checked
  };

  if (!anime.title) return;

  if (existing) {
    animeList = animeList.map(item => item.id === id ? anime : item);
  } else {
    animeList.push(anime);
  }

  saveData();
  $("animeForm").reset();
  $("animeId").value = "";
  $("published").checked = true;
  $("uploadStatus").textContent =
    "Anime saved in this browser's local storage.";

  renderAnime();
  renderAdmin();
  showToast("Anime saved!");
});

function renderAdmin() {
  $("adminList").innerHTML = animeList.map(anime => `
    <div class="panel">
      <strong>${escapeHTML(anime.title)}</strong>
      <p>${anime.published ? "Published" : "Draft"}</p>
      <button data-edit="${escapeHTML(anime.id)}">Edit</button>
      <button data-delete="${escapeHTML(anime.id)}">Delete</button>
    </div>
  `).join("");

  $("adminList").querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      animeList = animeList.filter(item => item.id !== id);
      watchlist = watchlist.filter(item => item !== id);
      history = history.filter(item => item !== id);
      saveData();
      renderAdmin();
      renderAnime();
    });
  });

  $("adminList").querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => {
      const anime = animeList.find(item => item.id === button.dataset.edit);
      if (!anime) return;

      $("animeId").value = anime.id;
      $("title").value = anime.title;
      $("description").value = anime.description;
      $("categories").value = anime.categories.join(", ");
      $("audioLanguage").value = anime.language;
      $("videoUrl").value = anime.video;
      $("published").checked = anime.published;

      showView("admin");
      window.scrollTo(0, 0);
    });
  });
}

$("resetForm").addEventListener("click", () => {
  $("animeForm").reset();
  $("animeId").value = "";
});

// Subtitle selection placeholder
$("subtitleSelect").addEventListener("change", () => {
  $("subtitleStatus").textContent =
    "Subtitle file integration is the next development step.";
});

// Initial setup
renderAnime();
renderAdmin();

console.log("AHSANIME 2.0 frontend loaded!");
