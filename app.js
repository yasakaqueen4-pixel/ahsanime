import { animeData } from "./data.js";

// AHSANIME 3.0
const animeList = animeData;

const $ = (selector) => document.querySelector(selector);

const animeGrid = $("#animeGrid");
const hindiGrid = $("#hindiGrid");
const watchlistGrid = $("#watchlistGrid");
const historyGrid = $("#historyGrid");
const searchInput = $("#searchInput");

let watchlist = JSON.parse(localStorage.getItem("ahsanime_watchlist") || "[]");
let history = JSON.parse(localStorage.getItem("ahsanime_history") || "[]");

function saveData() {
  localStorage.setItem("ahsanime_watchlist", JSON.stringify(watchlist));
  localStorage.setItem("ahsanime_history", JSON.stringify(history));
}

function makeCard(anime) {
  const card = document.createElement("article");
  card.className = "anime-card";

  const poster = anime.poster || "";
  const image = poster
    ? `<img src="${poster}" alt="" class="anime-poster">`
    : `<div class="anime-placeholder">🎬</div>`;

  card.innerHTML = `
    ${image}
    <div class="anime-card-info">
      <h3>${escapeHTML(anime.title)}</h3>
      <p>${escapeHTML(anime.category)} • ${escapeHTML(anime.language)}</p>
      <p>⭐ ${escapeHTML(anime.rating)}</p>
      <button class="watch-button">Watch</button>
      <button class="save-button">
        ${watchlist.includes(anime.id) ? "Saved ✓" : "＋ Watchlist"}
      </button>
    </div>
  `;

  card.querySelector(".watch-button").addEventListener("click", () => {
    openPlayer(anime);
  });

  card.querySelector(".save-button").addEventListener("click", () => {
    toggleWatchlist(anime.id);
    renderAll();
  });

  return card;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showCards(container, list) {
  if (!container) return;
  container.replaceChildren();

  if (!list.length) {
    container.textContent = "No anime found.";
    return;
  }

  list.forEach((anime) => container.appendChild(makeCard(anime)));
}

function renderAll() {
  showCards(animeGrid, animeList);
  showCards(
    hindiGrid,
    animeList.filter((anime) =>
      String(anime.language).toLowerCase().includes("hindi")
    )
  );
  showCards(
    watchlistGrid,
    animeList.filter((anime) => watchlist.includes(anime.id))
  );
  showCards(
    historyGrid,
    history.map((id) => animeList.find((anime) => anime.id === id)).filter(Boolean)
  );
}

function toggleWatchlist(id) {
  watchlist = watchlist.includes(id)
    ? watchlist.filter((item) => item !== id)
    : [...watchlist, id];

  saveData();
}

function openPlayer(anime) {
  const dialog = $("#playerDialog");
  const video = $("#videoPlayer");
  const info = $("#subtitleInfo");
  const select = $("#subtitleSelect");
  const tracks = $("#subtitleTracks");

  if (!dialog || !video) {
    alert("Player section nahi mila. index.html check karo.");
    return;
  }

  video.pause();
  video.removeAttribute("src");
  video.querySelectorAll("track").forEach((track) => track.remove());

  if (anime.videoUrl) {
    video.src = anime.videoUrl;
    video.load();
  }

  if (select) select.value = "off";

  if (tracks) {
    tracks.innerHTML = "";
    const subtitles = anime.subtitles || {};

    Object.entries({
      en: "English",
      hi: "Hindi",
      hinglish: "Hinglish"
    }).forEach(([key, label]) => {
      if (subtitles[key]) {
        const track = document.createElement("track");
        track.kind = "subtitles";
        track.label = label;
        track.srclang = key === "hinglish" ? "hi" : key;
        track.src = subtitles[key];
        tracks.appendChild(track);
      }
    });
  }

  if (info) {
    info.textContent = anime.videoUrl
      ? "Video loaded. Subtitle option available if a subtitle file is added."
      : "Demo anime: video URL abhi add nahi hua hai.";
  }

  history = [anime.id, ...history.filter((id) => id !== anime.id)].slice(0, 20);
  saveData();
  renderAll();

  dialog.showModal();
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();

    const results = animeList.filter((anime) =>
      `${anime.title} ${anime.category} ${anime.language}`
        .toLowerCase()
        .includes(query)
    );

    showCards(animeGrid, results);
  });
}

document.querySelectorAll("[data-category]").forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.category;

    const results = category === "All"
      ? animeList
      : animeList.filter((anime) =>
          anime.category.toLowerCase() === category.toLowerCase()
        );

    showCards(animeGrid, results);
  });
});

const closePlayer = $("#closePlayer");
if (closePlayer) {
  closePlayer.addEventListener("click", () => {
    const video = $("#videoPlayer");
    if (video) video.pause();
    $("#playerDialog")?.close();
  });
}

const subtitleSelect = $("#subtitleSelect");
if (subtitleSelect) {
  subtitleSelect.addEventListener("change", () => {
    const video = $("#videoPlayer");
    const info = $("#subtitleInfo");
    if (!video) return;

    [...video.textTracks].forEach((track) => {
      track.mode = "disabled";
    });

    const selected = subtitleSelect.value;

    if (selected !== "off") {
      const track = [...video.textTracks].find((item) =>
        item.language === (selected === "hinglish" ? "hi" : selected)
      );

      if (track) {
        track.mode = "showing";
        if (info) info.textContent = "Subtitle: " + selected;
      } else if (info) {
        info.textContent = "Is language ki subtitle file abhi add nahi hui.";
      }
    } else if (info) {
      info.textContent = "Subtitles off.";
    }
  });
}

// Theme toggle
const themeButton = $("#themeToggle");
if (themeButton) {
  themeButton.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem(
      "ahsanime_theme",
      document.body.classList.contains("light") ? "light" : "dark"
    );
  });
}

if (localStorage.getItem("ahsanime_theme") === "light") {
  document.body.classList.add("light");
}

// Login demo only — real secure login needs a backend
const loginDialog = $("#loginDialog");
$("#loginBtn")?.addEventListener("click", () => loginDialog?.showModal());
$("#closeLogin")?.addEventListener("click", () => loginDialog?.close());

function demoLogin() {
  const email = $("#emailInput")?.value.trim();
  const password = $("#passwordInput")?.value;
  const message = $("#loginMessage");

  if (!email || !password) {
    if (message) message.textContent = "Email aur password enter karo.";
    return;
  }

  if (message) {
    message.textContent =
      "Demo only: secure login abhi backend se connect nahi hai.";
  }
}

$("#signupBtn")?.addEventListener("click", demoLogin);
$("#signinBtn")?.addEventListener("click", demoLogin);

// First page load
renderAll();

console.log("AHSANIME 3.0 loaded successfully!");
