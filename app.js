
import { animeData } from "./data.js";

// AHSANIME 3.0 - UPDATED SUBTITLE PLAYER

const animeList = animeData;
const $ = (selector) => document.querySelector(selector);

const animeGrid = $("#animeGrid");
const hindiGrid = $("#hindiGrid");
const watchlistGrid = $("#watchlistGrid");
const historyGrid = $("#historyGrid");
const searchInput = $("#searchInput");

let watchlist = JSON.parse(localStorage.getItem("ahsanime_watchlist") || "[]");
let history = JSON.parse(localStorage.getItem("ahsanime_history") || "[]");

// Current anime subtitle tracks
let activeSubtitleTracks = new Map();

// SAVE DATA
function saveData() {
  localStorage.setItem("ahsanime_watchlist", JSON.stringify(watchlist));
  localStorage.setItem("ahsanime_history", JSON.stringify(history));
}

// ESCAPE HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// ANIME CARD
function makeCard(anime) {
  const card = document.createElement("article");
  card.className = "anime-card";

  const poster = anime.poster || "";
  const image = poster
    ? `<img src="${escapeHTML(poster)}" alt="" class="anime-poster">`
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

// SHOW CARDS
function showCards(container, list) {
  if (!container) return;

  container.replaceChildren();

  if (!list.length) {
    container.textContent = "No anime found.";
    return;
  }

  list.forEach((anime) => {
    container.appendChild(makeCard(anime));
  });
}

// RENDER ALL
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
    history.map((id) =>
      animeList.find((anime) => anime.id === id)
    ).filter(Boolean)
  );
}

// WATCHLIST
function toggleWatchlist(id) {
  watchlist = watchlist.includes(id)
    ? watchlist.filter((item) => item !== id)
    : [...watchlist, id];

  saveData();
}

// SUBTITLE LANGUAGES
const subtitleLanguages = [
  { key: "ja", code: "ja", label: "🇯🇵 Japanese Sub" },
  { key: "en", code: "en", label: "🇬🇧 English Sub" },
  { key: "hi", code: "hi", label: "🇮🇳 Hindi Sub" },
  { key: "hinglish", code: "hi-Latn", label: "🇮🇳 Hinglish (Roman)" }
];

// LOAD ANIME SUBTITLES
function loadAnimeSubtitles(anime, video, select) {
  // Remove old subtitle tracks
  video.querySelectorAll("track").forEach((track) => track.remove());

  activeSubtitleTracks.clear();

  const subtitles = anime.subtitles || {};

  // Automatically create language options
  if (select) {
    select.replaceChildren();

    const offOption = document.createElement("option");
    offOption.value = "off";
    offOption.textContent = "🚫 Off";
    select.appendChild(offOption);
  }

  subtitleLanguages.forEach((language) => {
    const url = subtitles[language.key];

    if (!url) return;

    // Create subtitle track
    const track = document.createElement("track");

    track.kind = "subtitles";
    track.label = language.label;
    track.srclang = language.code;
    track.src = url;
    track.default = false;

    video.appendChild(track);

    activeSubtitleTracks.set(language.key, track);

    // Add language to dropdown
    if (select) {
      const option = document.createElement("option");
      option.value = language.key;
      option.textContent = language.label;

      select.appendChild(option);
    }
  });

  if (select) {
    select.value = "off";
  }
}

// OPEN PLAYER
function openPlayer(anime) {
  const dialog = $("#playerDialog");
  const video = $("#videoPlayer");
  const info = $("#subtitleInfo");
  const select = $("#subtitleSelect");

  if (!dialog || !video) {
    alert("Player section nahi mila. index.html check karo.");
    return;
  }

  // Stop previous video
  video.pause();

  // Remove previous video and subtitles
  video.removeAttribute("src");
  video.querySelectorAll("track").forEach((track) => track.remove());

  activeSubtitleTracks.clear();

  // Load new video
  if (anime.videoUrl) {
    video.src = anime.videoUrl;
  }

  // Load new anime subtitles
  loadAnimeSubtitles(anime, video, select);

  // Load video and subtitle tracks
  video.load();

  if (info) {
    info.textContent = anime.videoUrl
      ? "Video loaded. Select your subtitle language."
      : "Demo anime: video URL abhi add nahi hua hai.";
  }

  // Save watch history
  history = [
    anime.id,
    ...history.filter((id) => id !== anime.id)
  ].slice(0, 20);

  saveData();
  renderAll();

  if (!dialog.open) {
    dialog.showModal();
  }
}

// SUBTITLE CHANGE
const subtitleSelect = $("#subtitleSelect");

if (subtitleSelect) {
  subtitleSelect.addEventListener("change", () => {
    const video = $("#videoPlayer");
    const info = $("#subtitleInfo");

    if (!video) return;

    const selected = subtitleSelect.value;

    // Turn all subtitle tracks off first
    Array.from(video.textTracks).forEach((track) => {
      track.mode = "disabled";
    });

    if (selected === "off") {
      if (info) info.textContent = "🚫 Subtitles off.";
      return;
    }

    const selectedTrack = activeSubtitleTracks.get(selected);

    if (!selectedTrack) {
      if (info) {
        info.textContent = "Is language ki subtitle file available nahi hai.";
      }
      return;
    }

    // Show selected subtitle
    selectedTrack.track.mode = "showing";

    if (info) {
      const language = subtitleLanguages.find(
        (item) => item.key === selected
      );

      info.textContent = "Subtitle: " + language.label;
    }
  });
}

// SEARCH
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

// CATEGORY FILTER
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

// CLOSE PLAYER
const closePlayer = $("#closePlayer");

if (closePlayer) {
  closePlayer.addEventListener("click", () => {
    const video = $("#videoPlayer");

    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.querySelectorAll("track").forEach((track) => track.remove());
      video.load();
    }

    activeSubtitleTracks.clear();

    $("#playerDialog")?.close();
  });
}

// THEME TOGGLE
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

// LOGIN DEMO
const loginDialog = $("#loginDialog");

$("#loginBtn")?.addEventListener("click", () => {
  loginDialog?.showModal();
});

$("#closeLogin")?.addEventListener("click", () => {
  loginDialog?.close();
});

function demoLogin() {
  const email = $("#emailInput")?.value.trim();
  const password = $("#passwordInput")?.value;
  const message = $("#loginMessage");

  if (!email || !password) {
    if (message) {
      message.textContent = "Email aur password enter karo.";
    }
    return;
  }

  if (message) {
    message.textContent =
      "Demo only: secure login abhi backend se connect nahi hai.";
  }
}

$("#signupBtn")?.addEventListener("click", demoLogin);
$("#signinBtn")?.addEventListener("click", demoLogin);

// FIRST PAGE LOAD
renderAll();

console.log("AHSANIME 3.0 loaded successfully!");
