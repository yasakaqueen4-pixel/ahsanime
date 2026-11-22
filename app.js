const animeList = [
  {
    id: 1,
    title: "Anime Adventure",
    category: "Adventure",
    language: "Hindi",
    rating: "9.2",
    description: "An exciting adventure in a mysterious world.",
    videoUrl: ""
  },
  {
    id: 2,
    title: "Fantasy Kingdom",
    category: "Fantasy",
    language: "Japanese",
    rating: "9.0",
    description: "A magical journey through another world.",
    videoUrl: ""
  },
  {
    id: 3,
    title: "Shadow Warrior",
    category: "Action",
    language: "Hindi",
    rating: "8.9",
    description: "A warrior discovers a hidden power.",
    videoUrl: ""
  },
  {
    id: 4,
    title: "Ancient Legends",
    category: "Historical",
    language: "Japanese",
    rating: "8.8",
    description: "An epic story inspired by an ancient era.",
    videoUrl: ""
  },
  {
    id: 5,
    title: "Spirit World",
    category: "Supernatural",
    language: "Hindi",
    rating: "9.1",
    description: "A mysterious supernatural adventure.",
    videoUrl: ""
  },
  {
    id: 6,
    title: "Dragon Path",
    category: "Martial Arts",
    language: "Japanese",
    rating: "8.7",
    description: "A journey of courage and martial arts.",
    videoUrl: ""
  },
  {
    id: 7,
    title: "Another Life",
    category: "Isekai",
    language: "Hindi",
    rating: "9.3",
    description: "A new beginning in another world.",
    videoUrl: ""
  },
  {
    id: 8,
    title: "Moonlight Story",
    category: "Romance",
    language: "Japanese",
    rating: "8.6",
    description: "A beautiful story of friendship and feelings.",
    videoUrl: ""
  }
];

const $ = (id) => document.getElementById(id);

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

let watchlist = readStorage("ahsanime_watchlist", []);
let history = readStorage("ahsanime_history", []);
let activeCategory = "All";
let searchText = "";

function saveData() {
  localStorage.setItem("ahsanime_watchlist", JSON.stringify(watchlist));
  localStorage.setItem("ahsanime_history", JSON.stringify(history));
}

function getAnime(id) {
  return animeList.find(anime => anime.id === Number(id));
}

function createCard(anime) {
  const saved = watchlist.includes(anime.id);

  return `
    <article class="anime-card">
      <div class="anime-poster">
        <span>アニメ</span>
      </div>
      <div class="anime-card-content">
        <h3>${anime.title}</h3>
        <p>${anime.category} • ${anime.language} • ⭐ ${anime.rating}</p>
        <button data-watch="${anime.id}">▶ Details</button>
        <button data-save="${anime.id}">
          ${saved ? "❤️ Saved" : "♡ Watchlist"}
        </button>
      </div>
    </article>
  `;
}

function renderGrid(elementId, items) {
  const element = $(elementId);
  if (!element) return;

  element.innerHTML = items.length
    ? items.map(createCard).join("")
    : '<p class="empty-message">No anime found.</p>';
}

function renderAnime() {
  const filtered = animeList.filter(anime => {
    const matchesSearch = anime.title
      .toLowerCase()
      .includes(searchText);

    const matchesCategory =
      activeCategory === "All" ||
      anime.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  renderGrid("animeGrid", filtered);

  const hindiAnime = filtered.filter(
    anime => anime.language === "Hindi"
  );

  renderGrid("hindiGrid", hindiAnime);

  renderGrid(
    "watchlistGrid",
    animeList.filter(anime => watchlist.includes(anime.id))
  );

  renderGrid(
    "historyGrid",
    history.map(getAnime).filter(Boolean)
  );
}

// SEARCH

$("searchInput")?.addEventListener("input", event => {
  searchText = event.target.value.trim().toLowerCase();
  renderAnime();
});

// CATEGORY FILTER

document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;

    document.querySelectorAll("[data-category]").forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");
    renderAnime();
    $("trending")?.scrollIntoView({ behavior: "smooth" });
  });
});

// ANIME CARD ACTIONS

document.addEventListener("click", event => {
  const watchButton = event.target.closest("[data-watch]");
  const saveButton = event.target.closest("[data-save]");

  if (watchButton) {
    openAnime(watchButton.dataset.watch);
  }

  if (saveButton) {
    toggleWatchlist(saveButton.dataset.save);
  }
});

function toggleWatchlist(id) {
  id = Number(id);

  if (watchlist.includes(id)) {
    watchlist = watchlist.filter(item => item !== id);
  } else {
    watchlist.push(id);
  }

  saveData();
  renderAnime();
}

// PLAYER

function openAnime(id) {
  const anime = getAnime(id);
  if (!anime) return;

  $("playerTitle").textContent = anime.title;

  const player = $("videoPlayer");
  player.pause();
  player.removeAttribute("src");
  player.load();

  const subtitleInfo = $("subtitleInfo");
  if (subtitleInfo) {
    subtitleInfo.textContent =
      "No subtitle tracks have been added for this demo.";
  }

  const subtitleMenu = $("subtitleSelect");
  if (subtitleMenu) subtitleMenu.value = "off";

  if (anime.videoUrl) {
    player.src = anime.videoUrl;
  }

  history = [anime.id, ...history.filter(item => item !== anime.id)]
    .slice(0, 30);

  saveData();
  renderAnime();

  $("playerDialog")?.showModal();
}

$("closePlayer")?.addEventListener("click", () => {
  $("videoPlayer")?.pause();
  $("playerDialog")?.close();
});

// SUBTITLE MENU DEMO

$("subtitleSelect")?.addEventListener("change", event => {
  const language = event.target.value;
  const messages = {
    off: "Subtitles turned off.",
    en: "English subtitle track is not added yet.",
    hi: "Hindi subtitle track is not added yet.",
    hinglish: "Hinglish subtitle track is not added yet."
  };

  $("subtitleInfo").textContent = messages[language];
});

// THEME TOGGLE

const savedTheme = localStorage.getItem("ahsanime_theme");

if (savedTheme === "light") {
  document.body.classList.add("light");
}

function updateThemeButton() {
  if ($("themeToggle")) {
    $("themeToggle").textContent =
      document.body.classList.contains("light") ? "🌙" : "☀️";
  }
}

updateThemeButton();

$("themeToggle")?.addEventListener("click", () => {
  document.body.classList.toggle("light");

  const theme = document.body.classList.contains("light")
    ? "light"
    : "dark";

  localStorage.setItem("ahsanime_theme", theme);
  updateThemeButton();
});

// LOGIN POPUP FRONTEND

$("loginBtn")?.addEventListener("click", () => {
  $("loginDialog")?.showModal();
});

$("closeLogin")?.addEventListener("click", () => {
  $("loginDialog")?.close();
});

$("signupBtn")?.addEventListener("click", () => {
  $("loginMessage").textContent =
    "Account creation will be connected to secure authentication later.";
});

$("signinBtn")?.addEventListener("click", () => {
  $("loginMessage").textContent =
    "Login will be connected to secure authentication later.";
});

// INITIAL DISPLAY

renderAnime();

console.log("AHSANIME 3.0 frontend loaded successfully!");
