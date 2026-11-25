
/* =========================================
   AnimeNoona ♡
   Main JavaScript + Supabase
========================================= */

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =========================================
   1. SUPABASE CONNECTION
========================================= */

const SUPABASE_URL = "https://yvfstkkcetyavpzqytde.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_NgpGgHlXHz_DdJfsRLA6Ug_InIZwy8D";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================================
   2. ELEMENTS
========================================= */

const $ = (id) => document.getElementById(id);

const animeGrid = $("animeGrid");
const continueGrid = $("continueGrid");
const watchlistGrid = $("watchlistGrid");

const video = $("video");
const playerTitle = $("playerTitle");
const episodeSelect = $("episodeSelect");
const subtitleSelect = $("subtitleSelect");

let animeList = [];
let currentAnime = null;
let currentEpisodes = [];
let currentUser = null;
let isAdmin = false;

let selectedCategory = "All";

const WATCHLIST_KEY = "animenoona_watchlist";
const HISTORY_KEY = "animenoona_history";

/* =========================================
   3. LOCAL STORAGE
========================================= */

function getStored(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveStored(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function notify(message) {
  alert(message);
}

/* =========================================
   4. LOAD ANIME
========================================= */

async function loadAnime() {
  if (!animeGrid) return;

  animeGrid.innerHTML = "<p>Loading anime...</p>";

  const { data, error } = await db
    .from("anime_uploads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    animeGrid.innerHTML =
      "<p>Anime load nahi hua. Database table check karo.</p>";
    return;
  }

  animeList = data || [];
  renderAnime();
  renderWatchlist();
  renderContinueWatching();
  populateAnimeDropdowns();
}

function getAnimeTitle(anime) {
  return anime.title || anime.name || "Untitled Anime";
}

function getAnimePoster(anime) {
  return anime.poster_url || anime.poster || "";
}

function getAnimeGenres(anime) {
  return anime.genre || anime.genres || "";
}

function renderAnime() {
  if (!animeGrid) return;

  const search = ($("searchInput")?.value || "")
    .trim()
    .toLowerCase();

  const filtered = animeList.filter((anime) => {
    const title = getAnimeTitle(anime).toLowerCase();
    const genre = String(getAnimeGenres(anime)).toLowerCase();
    const type = String(anime.anime_type || "").toLowerCase();

    const matchesSearch =
      title.includes(search) ||
      genre.includes(search) ||
      type.includes(search);

    const matchesCategory =
      selectedCategory === "All" ||
      genre.includes(selectedCategory.toLowerCase()) ||
      type.includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  if (!filtered.length) {
    animeGrid.innerHTML =
      '<p class="empty-message">No anime found.</p>';
    return;
  }

  animeGrid.innerHTML = filtered.map((anime) => {
    const id = escapeHTML(anime.id);
    const title = escapeHTML(getAnimeTitle(anime));
    const poster = escapeHTML(getAnimePoster(anime));
    const genre = escapeHTML(getAnimeGenres(anime));
    const type = escapeHTML(anime.anime_type || "Anime");

    return `
      <article class="anime-card">
        ${
          poster
            ? `<img src="${poster}" alt="${title}" loading="lazy">`
            : `<div class="anime-poster"></div>`
        }

        <div class="anime-card-content">
          <h3>${title}</h3>
          <p>${genre}</p>
          <p>${type}</p>

          <button data-play="${id}">
            ▶ Watch Now
          </button>

          <button data-save="${id}">
            ♡ Add to Watchlist
          </button>
        </div>
      </article>
    `;
  }).join("");
}

/* =========================================
   5. SEARCH
========================================= */

$("searchInput")?.addEventListener("input", renderAnime);

$("searchBtn")?.addEventListener("click", renderAnime);

/* =========================================
   6. CATEGORY FILTERS
========================================= */

$("categoryFilters")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  selectedCategory = button.dataset.category;

  document.querySelectorAll(".filter-btn").forEach((item) => {
    item.classList.remove("active");
  });

  button.classList.add("active");
  renderAnime();
});

/* =========================================
   7. ANIME CARD ACTIONS
========================================= */

animeGrid?.addEventListener("click", async (event) => {
  const playButton = event.target.closest("[data-play]");
  const saveButton = event.target.closest("[data-save]");

  if (playButton) {
    await openAnime(playButton.dataset.play);
  }

  if (saveButton) {
    addToWatchlist(saveButton.dataset.save);
  }
});

/* =========================================
   8. WATCHLIST
========================================= */

function addToWatchlist(id) {
  const list = getStored(WATCHLIST_KEY);

  if (list.includes(String(id))) {
    notify("Already in your Watchlist ♡");
    return;
  }

  list.push(String(id));
  saveStored(WATCHLIST_KEY, list);

  renderWatchlist();
  notify("Added to Watchlist ♡");
}

function removeFromWatchlist(id) {
  const list = getStored(WATCHLIST_KEY)
    .filter((item) => item !== String(id));

  saveStored(WATCHLIST_KEY, list);
  renderWatchlist();
}

function renderWatchlist() {
  if (!watchlistGrid) return;

  const saved = getStored(WATCHLIST_KEY);

  const items = animeList.filter((anime) =>
    saved.includes(String(anime.id))
  );

  if (!items.length) {
    watchlistGrid.innerHTML =
      '<p class="empty-message">Your Watchlist is empty.</p>';
    return;
  }

  watchlistGrid.innerHTML = items.map((anime) => `
    <article class="anime-card">
      ${
        getAnimePoster(anime)
          ? `<img src="${escapeHTML(getAnimePoster(anime))}" alt="${escapeHTML(getAnimeTitle(anime))}">`
          : `<div class="anime-poster"></div>`
      }

      <div class="anime-card-content">
        <h3>${escapeHTML(getAnimeTitle(anime))}</h3>
        <button data-watch="${escapeHTML(anime.id)}">
          ▶ Watch
        </button>
        <button data-remove="${escapeHTML(anime.id)}">
          Remove
        </button>
      </div>
    </article>
  `).join("");
}

watchlistGrid?.addEventListener("click", async (event) => {
  const watch = event.target.closest("[data-watch]");
  const remove = event.target.closest("[data-remove]");

  if (watch) await openAnime(watch.dataset.watch);
  if (remove) removeFromWatchlist(remove.dataset.remove);
});

/* =========================================
   9. CONTINUE WATCHING
========================================= */

function saveProgress(animeId, episodeId, time, duration) {
  if (!animeId || !episodeId) return;

  const history = getStored(HISTORY_KEY);

  const updated = history.filter(
    (item) => String(item.animeId) !== String(animeId)
  );

  updated.unshift({
    animeId: String(animeId),
    episodeId: String(episodeId),
    time,
    duration,
    updatedAt: Date.now()
  });

  saveStored(HISTORY_KEY, updated.slice(0, 30));
}

function renderContinueWatching() {
  if (!continueGrid) return;

  const history = getStored(HISTORY_KEY);

  const items = history
    .map((entry) => {
      const anime = animeList.find(
        (item) => String(item.id) === String(entry.animeId)
      );

      return anime ? { ...entry, anime } : null;
    })
    .filter(Boolean);

  if (!items.length) {
    continueGrid.innerHTML =
      '<p class="empty-message">Your watch history will appear here.</p>';
    return;
  }

  continueGrid.innerHTML = items.map((entry) => `
    <article class="anime-card">
      ${
        getAnimePoster(entry.anime)
          ? `<img src="${escapeHTML(getAnimePoster(entry.anime))}" alt="${escapeHTML(getAnimeTitle(entry.anime))}">`
          : `<div class="anime-poster"></div>`
      }

      <div class="anime-card-content">
        <h3>${escapeHTML(getAnimeTitle(entry.anime))}</h3>
        <p>Continue watching</p>
        <button data-continue="${escapeHTML(entry.animeId)}"
                data-episode="${escapeHTML(entry.episodeId)}">
          ▶ Continue
        </button>
      </div>
    </article>
  `).join("");
}

continueGrid?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-continue]");
  if (!button) return;

  await openAnime(button.dataset.continue, button.dataset.episode);
});

/* =========================================
   10. OPEN ANIME + LOAD EPISODES
========================================= */

async function openAnime(id, resumeEpisodeId = null) {
  currentAnime = animeList.find(
    (anime) => String(anime.id) === String(id)
  );

  if (!currentAnime) {
    notify("Anime not found.");
    return;
  }

  if (playerTitle) {
    playerTitle.textContent = getAnimeTitle(currentAnime);
  }

  $("playerDescription").textContent =
    currentAnime.description || "";

  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.querySelectorAll("track").forEach((track) => track.remove());
    video.load();
  }

  if (episodeSelect) {
    episodeSelect.innerHTML =
      '<option value="">Loading episodes...</option>';
  }

  const { data, error } = await db
    .from("anime_episodes")
    .select("*")
    .eq("anime_id", currentAnime.id)
    .order("episode_number", { ascending: true });

  if (error) {
    console.error(error);
    notify("Episode load error. Database check karo.");
    return;
  }

  currentEpisodes = data || [];

  if (!currentEpisodes.length) {
    if (episodeSelect) {
      episodeSelect.innerHTML =
        '<option value="">No episodes available</option>';
    }

    notify("Is anime ke episodes abhi available nahi hain.");
    $("player")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  if (episodeSelect) {
    episodeSelect.innerHTML = currentEpisodes.map((episode) => `
      <option value="${escapeHTML(episode.id)}">
        Episode ${escapeHTML(episode.episode_number)}
        ${episode.title ? " - " + escapeHTML(episode.title) : ""}
      </option>
    `).join("");
  }

  const selectedEpisode =
    currentEpisodes.find(
      (episode) => String(episode.id) === String(resumeEpisodeId)
    ) || currentEpisodes[0];

  if (episodeSelect) {
    episodeSelect.value = selectedEpisode.id;
  }

  await playEpisode(selectedEpisode);

  $("player")?.scrollIntoView({ behavior: "smooth" });
}

/* =========================================
   11. PLAY EPISODE
========================================= */

async function playEpisode(episode) {
  if (!episode || !video) return;

  video.pause();

  video.querySelectorAll("track").forEach((track) => track.remove());

  video.src = episode.video_url;
  video.load();

  if ($("nowPlaying")) {
    $("nowPlaying").textContent =
      `Now Playing: Episode ${episode.episode_number}`;
  }

  video.onloadedmetadata = () => {
    const history = getStored(HISTORY_KEY);

    const saved = history.find(
      (item) =>
        String(item.animeId) === String(currentAnime.id) &&
        String(item.episodeId) === String(episode.id)
    );

    if (saved?.time > 0 && saved.time < video.duration - 10) {
      video.currentTime = saved.time;
    }
  };

  await loadSubtitles(episode.id);

  video.play().catch(() => {
    console.log("Press play to start the video.");
  });
}

episodeSelect?.addEventListener("change", async () => {
  const episode = currentEpisodes.find(
    (item) => String(item.id) === String(episodeSelect.value)
  );

  if (episode) {
    await playEpisode(episode);
  }
});

/* =========================================
   12. SAVE WATCH PROGRESS
========================================= */

let lastProgressSave = 0;

video?.addEventListener("timeupdate", () => {
  if (!currentAnime || !episodeSelect?.value) return;

  const now = Date.now();

  if (now - lastProgressSave < 5000) return;

  lastProgressSave = now;

  saveProgress(
    currentAnime.id,
    episodeSelect.value,
    video.currentTime,
    video.duration || 0
  );
});

video?.addEventListener("ended", () => {
  if (!currentAnime || !episodeSelect?.value) return;

  saveProgress(
    currentAnime.id,
    episodeSelect.value,
    0,
    video.duration || 0
  );
});

/* =========================================
   13. SUBTITLE SYSTEM
========================================= */

async function loadSubtitles(episodeId) {
  if (!video || !subtitleSelect) return;

  const { data, error } = await db
    .from("anime_subtitles")
    .select("*")
    .eq("episode_id", episodeId);

  if (error) {
    console.warn("Subtitle table not ready:", error.message);
    subtitleSelect.value = "off";
    $("subtitleInfo").textContent =
      "Subtitle files are not configured yet.";
    return;
  }

  video.querySelectorAll("track").forEach((track) => track.remove());

  (data || []).forEach((subtitle) => {
    const track = document.createElement("track");

    track.kind = "subtitles";
    track.src = subtitle.subtitle_url;
    track.srclang = subtitle.language_code;
    track.label = subtitle.language_name || subtitle.language_code;
    track.default = false;

    video.appendChild(track);
  });

  subtitleSelect.value = "off";

  $("subtitleInfo").textContent =
    "Select Japanese, English, Hindi or Hinglish subtitles.";
}

subtitleSelect?.addEventListener("change", () => {
  const language = subtitleSelect.value;
  const tracks = video?.textTracks;

  if (!tracks) return;

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].mode =
      language !== "off" &&
      tracks[i].language === language
        ? "showing"
        : "disabled";
  }

  $("subtitleInfo").textContent =
    language === "off"
      ? "Subtitles Off"
      : `Selected subtitle: ${language}`;
});

/* =========================================
   14. LOGIN / SIGNUP / FORGOT PASSWORD
========================================= */

function showAuthForm(type) {
  $("loginForm").hidden = type !== "login";
  $("signupForm").hidden = type !== "signup";
  $("forgotForm").hidden = type !== "forgot";

  $("authTitle").textContent = {
    login: "Login to AnimeNoona",
    signup: "Create Your Account",
    forgot: "Reset Your Password"
  }[type];

  $("authMessage").textContent = "";

  $("authSection")?.scrollIntoView({ behavior: "smooth" });
}

$("loginOpenBtn")?.addEventListener("click", () => {
  showAuthForm("login");
});

$("signupOpenBtn")?.addEventListener("click", () => {
  showAuthForm("signup");
});

$("forgotOpenBtn")?.addEventListener("click", () => {
  showAuthForm("forgot");
});

$("loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  $("authMessage").textContent = "Logging in...";

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    $("authMessage").textContent = error.message;
    return;
  }

  notify("Login successful!");
});

$("signupForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim();
  const password = $("signupPassword").value;

  $("authMessage").textContent = "Creating account...";

  const { error } = await db.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  });

  if (error) {
    $("authMessage").textContent = error.message;
    return;
  }

  $("authMessage").textContent =
    "Account created! Check your email if confirmation is enabled.";
});

$("forgotForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("forgotEmail").value.trim();

  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });

  $("authMessage").textContent = error
    ? error.message
    : "Password reset link sent. Check your email.";
});

/* =========================================
   15. AUTH STATE + ADMIN CHECK
========================================= */

async function checkAdmin() {
  isAdmin = false;

  if (!currentUser) {
    $("adminDashboard").hidden = true;
    return;
  }

  const { data, error } = await db.rpc("is_admin");

  if (error) {
    console.warn("Admin check failed:", error.message);
    $("adminDashboard").hidden = true;
    return;
  }

  isAdmin = data === true;
  $("adminDashboard").hidden = !isAdmin;
}

async function updateAuthUI() {
  const { data } = await db.auth.getUser();

  currentUser = data.user || null;

  $("loginOpenBtn").hidden = !!currentUser;
  $("signupOpenBtn").hidden = !!currentUser;
  $("logoutBtn").hidden = !currentUser;

  await checkAdmin();
}

$("logoutBtn")?.addEventListener("click", async () => {
  const { error } = await db.auth.signOut();

  if (error) {
    notify(error.message);
    return;
  }

  notify("Logged out.");
});

db.auth.onAuthStateChange(() => {
  setTimeout(updateAuthUI, 0);
});

/* =========================================
   16. ADMIN: ADD ANIME
========================================= */

$("animeUploadForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isAdmin) {
    notify("Admin access required.");
    return;
  }

  const anime = {
    title: $("animeName").value.trim(),
    description: $("animeDescription").value.trim(),
    genre: $("animeGenre").value.trim(),
    anime_type: $("animeType").value,
    poster_url: $("animePoster").value.trim()
  };

  $("adminMessage").textContent = "Adding anime...";

  const { error } = await db
    .from("anime_uploads")
    .insert(anime);

  if (error) {
    $("adminMessage").textContent = error.message;
    return;
  }

  $("animeUploadForm").reset();
  $("adminMessage").textContent = "Anime added successfully!";

  await loadAnime();
});

/* =========================================
   17. ADMIN DROPDOWNS
========================================= */

function populateAnimeDropdowns() {
  ["episodeAnime", "subtitleAnime"].forEach((id) => {
    const select = $(id);
    if (!select) return;

    select.innerHTML =
      '<option value="">Select Anime</option>' +
      animeList.map((anime) => `
        <option value="${escapeHTML(anime.id)}">
          ${escapeHTML(getAnimeTitle(anime))}
        </option>
      `).join("");
  });
}

/* =========================================
   18. ADMIN: ADD EPISODE
========================================= */

$("episodeUploadForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isAdmin) {
    notify("Admin access required.");
    return;
  }

  const animeId = $("episodeAnime").value;

  if (!animeId) {
    notify("Select an anime first.");
    return;
  }

  const episode = {
    anime_id: animeId,
    episode_number: Number($("episodeNumber").value),
    title: $("episodeTitle").value.trim(),
    video_url: $("episodeVideoUrl").value.trim()
  };

  $("adminMessage").textContent = "Adding episode...";

  const { error } = await db
    .from("anime_episodes")
    .insert(episode);

  if (error) {
    $("adminMessage").textContent = error.message;
    return;
  }

  $("episodeUploadForm").reset();
  $("adminMessage").textContent = "Episode added successfully!";
});

/* =========================================
   19. ADMIN: ADD SUBTITLE
========================================= */

$("subtitleUploadForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isAdmin) {
    notify("Admin access required.");
    return;
  }

  const animeId = $("subtitleAnime").value;
  const language = $("subtitleLanguage").value;
  const subtitleUrl = $("subtitleUrl").value.trim();

  if (!animeId || !subtitleUrl) {
    notify("Select anime and enter subtitle URL.");
    return;
  }

  const { data: episodes, error: episodeError } = await db
    .from("anime_episodes")
    .select("id")
    .eq("anime_id", animeId);

  if (episodeError || !episodes?.length) {
    notify("No episodes found for this anime.");
    return;
  }

  const languageNames = {
    ja: "Japanese",
    en: "English",
    hi: "Hindi",
    "hi-Latn": "Hinglish (Roman)"
  };

  const rows = episodes.map((episode) => ({
    episode_id: episode.id,
    language_code: language,
    language_name: languageNames[language],
    subtitle_url: subtitleUrl
  }));

  const { error } = await db
    .from("anime_subtitles")
    .insert(rows);

  if (error) {
    $("adminMessage").textContent = error.message;
    return;
  }

  $("subtitleUploadForm").reset();
  $("adminMessage").textContent =
    "Subtitle added to all episodes of selected anime.";
});

/* =========================================
   20. INITIAL START
========================================= */

async function startAnimeNoona() {
  await loadAnime();
  await updateAuthUI();
}

startAnimeNoona().catch((error) => {
  console.error("AnimeNoona startup error:", error);
});
